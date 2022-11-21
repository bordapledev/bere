import React, { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import EyeIcon from 'src/assets/icons/eye.svg'
import LockIcon from 'src/assets/icons/lock.svg'
import MapIcon from 'src/assets/icons/map.svg'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'

export function ManualBackupEducationSection() {
  const { t } = useTranslation()
  const spacer = <Box borderTopColor="backgroundOutline" borderTopWidth={0.5} />
  const theme = useAppTheme()

  const ICON_SIZE = theme.iconSizes.md

  return (
    <Flex gap="md" mt="md" mx="md">
      <EducationRow
        icon={
          <EyeIcon
            color={theme.colors.accentBranded}
            height={ICON_SIZE}
            strokeWidth={1.5}
            width={ICON_SIZE}
          />
        }
        label={t('Write it down in private')}
        sublabel={t('Make sure your phrase isn’t seen by anyone.')}
      />
      {spacer}
      <EducationRow
        icon={<LockIcon color={theme.colors.accentBranded} height={ICON_SIZE} width={ICON_SIZE} />}
        label={t('Keep it somewhere safe')}
        sublabel={t('Anyone who finds it can access your wallet.')}
      />
      {spacer}
      <EducationRow
        icon={
          <MapIcon
            color={theme.colors.accentBranded}
            height={ICON_SIZE}
            strokeWidth={2}
            width={ICON_SIZE}
          />
        }
        label={t("Don't lose it")}
        sublabel={t('If you do, you won’t be able to recover your assets.')}
      />
    </Flex>
  )
}

interface EducationRowProps {
  icon: ReactNode
  label: string
  sublabel: string
}

function EducationRow({ icon, label, sublabel }: EducationRowProps) {
  return (
    <Flex row alignItems="center" gap="md">
      <Box>{icon}</Box>
      <Flex flex={1} gap="none">
        <Text color="textPrimary" variant="bodyLarge">
          {label}
        </Text>
        <Flex pr="xl">
          <Text color="textSecondary" variant="bodyMicro">
            {sublabel}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
