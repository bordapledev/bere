import { useNavigation } from '@react-navigation/core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { ElementName } from 'src/features/telemetry/constants'
import { createAccountActions } from 'src/features/wallet/createAccountSaga'
import { unlockWallet } from 'src/features/wallet/walletSlice'
import { Screens } from 'src/screens/Screens'

export function WelcomeScreen() {
  const dispatch = useAppDispatch()
  const navigation = useNavigation<any>()

  const onPressCreate = () => {
    dispatch(createAccountActions.trigger(0))
    dispatch(unlockWallet())
  }

  const onPressImport = () => {
    navigation.navigate(Screens.ImportAccount)
  }

  const { t } = useTranslation()
  return (
    <Screen>
      <Box alignItems="center">
        <Text textAlign="center" variant="h1">
          {t('Uniswap Wallet')}
        </Text>
        <PrimaryButton
          label={t('Create New Account')}
          mt="lg"
          name={ElementName.CreateAccount}
          onPress={onPressCreate}
        />
        <PrimaryButton
          label={t('Import Account')}
          mt="lg"
          name={ElementName.ImportAccount}
          testID="import-account-button"
          onPress={onPressImport}
        />
      </Box>
    </Screen>
  )
}
