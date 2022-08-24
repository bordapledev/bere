import { Currency } from '@uniswap/sdk-core'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { Button, ButtonEmphasis, ButtonSize, ButtonState } from 'src/components-uds/Button/Button'
import { IconButton } from 'src/components/buttons/IconButton'
import { SendButton } from 'src/components/buttons/SendButton'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Heart } from 'src/components/icons/Heart'
import { Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Box } from 'src/components/layout/Box'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { CurrencyPriceChart } from 'src/components/PriceChart'
import { Text } from 'src/components/Text'
import { TokenBalances } from 'src/components/TokenDetails/TokenBalances'
import { TokenDetailsBackButtonRow } from 'src/components/TokenDetails/TokenDetailsBackButtonRow'
import { TokenDetailsStats } from 'src/components/TokenDetails/TokenDetailsStats'
import TokenWarningCard from 'src/components/tokens/TokenWarningCard'
import TokenWarningModal from 'src/components/tokens/TokenWarningModal'
import { AssetType } from 'src/entities/assets'
import { useSingleBalance } from 'src/features/dataApi/balances'
import { useSpotPrices } from 'src/features/dataApi/prices'
import { useToggleFavoriteCallback } from 'src/features/favorites/hooks'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { useCurrency } from 'src/features/tokens/useCurrency'
import { TokenWarningLevel, useTokenWarningLevel } from 'src/features/tokens/useTokenWarningLevel'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { Screens } from 'src/screens/Screens'
import { currencyAddress, currencyId } from 'src/utils/currencyId'
import { formatUSDPrice } from 'src/utils/format'

interface TokenDetailsHeaderProps {
  currency: Currency
}

function TokenDetailsHeader({ currency }: TokenDetailsHeaderProps) {
  const { t } = useTranslation()

  const isFavoriteToken = useAppSelector(selectFavoriteTokensSet).has(currencyId(currency))
  const onFavoritePress = useToggleFavoriteCallback(currencyId(currency))

  return (
    <Flex row justifyContent="space-between" mx="md">
      <Flex centered row gap="xs">
        <CurrencyLogo currency={currency} size={36} />
        <Box>
          <Text variant="headlineSmall">{currency.name ?? t('Unknown token')}</Text>
          <Text color="textTertiary" variant="caption">
            {currency.symbol ?? t('Unknown token')}
          </Text>
        </Box>
      </Flex>
      <Flex row gap="none">
        <SendButton iconOnly bg="none" iconColor="textPrimary" iconSize={24} />
        <IconButton
          icon={<Heart active={isFavoriteToken} size={24} />}
          px="none"
          variant="transparent"
          onPress={onFavoritePress}
        />
      </Flex>
    </Flex>
  )
}

function HeaderTitleElement({ currency }: TokenDetailsHeaderProps) {
  const { t } = useTranslation()
  const currencies = useMemo(() => [currency], [currency])

  const { loading, spotPrices } = useSpotPrices(currencies)

  return (
    <Flex centered gap="none">
      <Flex centered row gap="xs">
        <CurrencyLogo currency={currency} size={16} />
        <Text variant="subhead">{currency.name ?? t('Unknown token')}</Text>
      </Flex>
      {loading ? null : (
        <Text color="textSecondary" variant="caption">
          {formatUSDPrice(spotPrices[currencyId(currency)]?.price) ?? t('Unknown token')}
        </Text>
      )}
    </Flex>
  )
}

enum SwapType {
  BUY,
  SELL,
}

export function TokenDetailsScreen({ route }: AppStackScreenProp<Screens.TokenDetails>) {
  const { currencyId: _currencyId } = route.params

  const currency = useCurrency(_currencyId)

  if (!currency) return null
  return <TokenDetails currency={currency} />
}

function TokenDetails({ currency }: { currency: Currency }) {
  const balance = useSingleBalance(currency)

  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const { tokenWarningLevel, tokenWarningDismissed, warningDismissCallback } = useTokenWarningLevel(
    currency.wrapped
  )

  // set if attempting buy or sell, use for warning modal
  const [activeSwapAttemptType, setActiveSwapAttemptType] = useState<SwapType | undefined>(
    undefined
  )

  const initialSendState = useMemo((): TransactionState => {
    return {
      exactCurrencyField: CurrencyField.INPUT,
      exactAmountToken: '',
      [CurrencyField.INPUT]: {
        address: currencyAddress(currency),
        chainId: currency.wrapped.chainId,
        type: AssetType.Currency,
      },
      [CurrencyField.OUTPUT]: null,
    }
  }, [currency])

  const navigateToSwapBuy = useCallback(() => {
    setActiveSwapAttemptType(undefined)
    const swapFormState: TransactionState = {
      exactCurrencyField: CurrencyField.OUTPUT,
      exactAmountToken: '0',
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: {
        address: currencyAddress(currency),
        chainId: currency.wrapped.chainId,
        type: AssetType.Currency,
      },
    }
    dispatch(openModal({ name: ModalName.Swap, initialState: swapFormState }))
  }, [currency, dispatch])

  const navigateToSwapSell = useCallback(() => {
    setActiveSwapAttemptType(undefined)
    const swapFormState: TransactionState = {
      exactCurrencyField: CurrencyField.INPUT,
      exactAmountToken: '0',
      [CurrencyField.INPUT]: {
        address: currencyAddress(currency),
        chainId: currency.wrapped.chainId,
        type: AssetType.Currency,
      },
      [CurrencyField.OUTPUT]: null,
    }
    dispatch(openModal({ name: ModalName.Swap, initialState: swapFormState }))
  }, [currency, dispatch])

  const onPressSwap = useCallback(
    (swapType: SwapType) => {
      // show warning modal speedbump if token has a warning level and user has not dismissed
      if (tokenWarningLevel !== TokenWarningLevel.NONE && !tokenWarningDismissed) {
        setActiveSwapAttemptType(swapType)
      } else {
        if (swapType === SwapType.BUY) {
          navigateToSwapBuy()
        }
        if (swapType === SwapType.SELL) {
          navigateToSwapSell()
        }
        return
      }
    },
    [navigateToSwapBuy, navigateToSwapSell, tokenWarningDismissed, tokenWarningLevel]
  )

  return (
    <>
      <HeaderScrollScreen
        contentHeader={<TokenDetailsBackButtonRow currency={currency} />}
        fixedHeader={
          <BackHeader>
            <HeaderTitleElement currency={currency} />
          </BackHeader>
        }>
        <Flex gap="md" mb="xl" mt="lg">
          <TokenDetailsHeader currency={currency} />
          <CurrencyPriceChart currency={currency} />
          {balance && <TokenBalances balance={balance} />}
          <TokenDetailsStats currency={currency} />
          {tokenWarningLevel !== TokenWarningLevel.NONE && !tokenWarningDismissed && (
            <Box mx="md">
              <TokenWarningCard
                tokenWarningLevel={tokenWarningLevel}
                onDismiss={warningDismissCallback}
              />
            </Box>
          )}
        </Flex>
      </HeaderScrollScreen>

      <Flex
        row
        bg="backgroundBackdrop"
        bottom={0}
        gap="sm"
        pb="xl"
        position="absolute"
        pt="sm"
        px="sm">
        <Button
          emphasis={ButtonEmphasis.High}
          flex={1}
          label={t('Swap')}
          size={ButtonSize.Medium}
          state={
            tokenWarningLevel === TokenWarningLevel.BLOCKED
              ? ButtonState.Disabled
              : ButtonState.Enabled
          }
          onPress={() => onPressSwap(balance ? SwapType.SELL : SwapType.BUY)}
        />
        {balance && (
          <SendButton
            iconOnly
            disabled={!balance}
            iconStrokeWidth={1.5}
            initialState={initialSendState}
          />
        )}
      </Flex>

      {activeSwapAttemptType === SwapType.BUY || activeSwapAttemptType === SwapType.SELL ? (
        <TokenWarningModal
          isVisible
          currency={currency}
          tokenWarningLevel={tokenWarningLevel}
          onAccept={activeSwapAttemptType === SwapType.BUY ? navigateToSwapBuy : navigateToSwapSell}
          onClose={() => setActiveSwapAttemptType(undefined)}
        />
      ) : null}
    </>
  )
}
