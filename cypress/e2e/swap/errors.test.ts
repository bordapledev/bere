import { BigNumber } from '@ethersproject/bignumber'
import { SupportedChainId } from '@uniswap/sdk-core'

import { UNI, USDC_MAINNET } from '../../../src/constants/tokens'
import { getBalance, getTestSelector } from '../../utils'

const UNI_MAINNET = UNI[SupportedChainId.MAINNET]

describe('Swap errors', () => {
  it('wallet rejection', () => {
    cy.visit(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`, { ethereum: 'hardhat' })
    cy.hardhat().then((hardhat) => {
      // Stub the wallet to reject any transaction.
      cy.stub(hardhat.wallet, 'sendTransaction').log(false).rejects(new Error('user cancelled'))

      // Enter amount to swap
      cy.get('#swap-currency-output .token-amount-input').type('1').should('have.value', '1')
      cy.get('#swap-currency-input .token-amount-input').should('not.have.value', '')

      // Submit transaction
      cy.get('#swap-button').click()
      cy.get('#confirm-swap-or-send').click()
      cy.wait('@eth_estimateGas')

      // Verify rejection
      cy.contains('Transaction rejected').should('exist')
      cy.contains('Dismiss').click()
      cy.contains('Transaction rejected').should('not.exist')
    })
  })

  it('transaction past deadline', () => {
    cy.visit(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`, { ethereum: 'hardhat' })
    cy.hardhat({ automine: false })
    getBalance(USDC_MAINNET).then((initialBalance) => {
      // Set deadline to minimum: 1 minute
      cy.get(getTestSelector('open-settings-dialog-button')).click()
      cy.get(getTestSelector('transaction-deadline-settings')).click()
      cy.get(getTestSelector('deadline-input')).clear().type('1')
      cy.get('body').click('topRight') // close modal
      cy.get(getTestSelector('deadline-input')).should('not.exist')

      // Enter amount to swap
      cy.get('#swap-currency-output .token-amount-input').type('1').should('have.value', '1')
      cy.get('#swap-currency-input .token-amount-input').should('not.have.value', '')

      // Submit transaction
      cy.get('#swap-button').click()
      cy.get('#confirm-swap-or-send').click()
      cy.contains('Waiting for confirmation')
      cy.wait('@eth_estimateGas').wait('@eth_sendRawTransaction').wait('@eth_getTransactionReceipt')
      cy.contains('Waiting for confirmation').should('not.exist')
      cy.contains('Transaction submitted')
      cy.contains('Close').click()
      cy.contains('Transaction submitted').should('not.exist')

      // Mine transaction
      cy.get(getTestSelector('web3-status-connected')).should('contain', '1 Pending')
      cy.hardhat().then(async (hardhat) => {
        // Remove the transaction from the mempool, so that it doesn't fail but it is past the deadline.
        // This should result in it being removed from pending transactions, without a failure notificiation.
        const transactions = await hardhat.send('eth_pendingTransactions', [])
        console.log(transactions)
        await hardhat.send('hardhat_dropTransaction', [transactions[0].hash])
        // Mine past the deadline
        await hardhat.mine(1, /* 10 minutes */ 1000 * 60 * 10)
      })
      cy.wait('@eth_getTransactionReceipt')

      // Verify transaction did not occur
      cy.get(getTestSelector('web3-status-connected')).should('not.contain', 'Pending')
      cy.get(getTestSelector('popups')).should('not.contain', 'Swap failed')
      cy.get('#swap-currency-output').contains(`Balance: ${initialBalance}`)
      getBalance(USDC_MAINNET).should('eq', initialBalance)
    })
  })

  it('slippage failure', () => {
    cy.visit(`/swap?inputCurrency=ETH&outputCurrency=${UNI_MAINNET.address}`, { ethereum: 'hardhat' })
    cy.hardhat({ automine: false })
    getBalance(USDC_MAINNET).then((initialBalance) => {
      // Gas estimation fails for this transaction (that would normally fail), so we stub it.
      cy.hardhat().then((hardhat) => {
        const send = cy.stub(hardhat.provider, 'send').log(false)
        send.withArgs('eth_estimateGas').resolves(BigNumber.from(2_000_000))
        send.callThrough()
      })

      // Set slippage to a very low value.
      cy.get(getTestSelector('open-settings-dialog-button')).click()
      cy.get(getTestSelector('max-slippage-settings')).click()
      cy.get(getTestSelector('slippage-input')).clear().type('0.01')
      cy.get('body').click('topRight') // close modal
      cy.get(getTestSelector('slippage-input')).should('not.exist')

      // Submit 2 transactions
      for (let i = 0; i < 2; i++) {
        cy.get('#swap-currency-input .token-amount-input').type('200').should('have.value', '200')
        cy.get('#swap-currency-output .token-amount-input').should('not.have.value', '')
        cy.get('#swap-button').click()
        cy.get('#confirm-swap-or-send').click()
        cy.contains('Waiting for confirmation')
        cy.wait('@eth_sendRawTransaction').wait('@eth_getTransactionReceipt')
        cy.contains('Waiting for confirmation').should('not.exist')
        cy.contains('Transaction submitted')
        cy.contains('Close').click()
        cy.contains('Transaction submitted').should('not.exist')
      }

      // Mine transactions
      cy.get(getTestSelector('web3-status-connected')).should('contain', '2 Pending')
      cy.hardhat().then((hardhat) => hardhat.mine())
      cy.wait('@eth_getTransactionReceipt')

      // Verify transaction did not occur
      cy.get(getTestSelector('web3-status-connected')).should('not.contain', 'Pending')
      cy.get(getTestSelector('popups')).contains('Swap failed')
      getBalance(UNI_MAINNET).should('eq', initialBalance)
    })
  })
})