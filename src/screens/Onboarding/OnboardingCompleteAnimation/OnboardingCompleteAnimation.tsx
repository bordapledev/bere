import {
  Blur,
  Canvas,
  Group,
  Oval,
  RoundedRect,
  SkiaValue,
  useSharedValueEffect,
  useValue,
} from '@shopify/react-native-skia'
import { ResizeMode, Video } from 'expo-av'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, useColorScheme, View } from 'react-native'
import Animated, {
  AnimateStyle,
  Easing,
  EntryExitAnimationFunction,
  runOnJS,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { ONBOARDING_QR_ETCHING_VIDEO_DARK, ONBOARDING_QR_ETCHING_VIDEO_LIGHT } from 'src/assets'
import { Button } from 'src/components/buttons/Button'
import { Box, Flex } from 'src/components/layout'
import { QRCodeDisplay } from 'src/components/QRCodeScanner/QRCode'
import { Text } from 'src/components/Text'
import { useUniconColors } from 'src/components/unicons/utils'
import { ElementName } from 'src/features/telemetry/constants'
import {
  bgGlowTranslateX,
  flashWipeAnimation,
  letsGoButtonFadeIn,
  qrInnerBlurConfig,
  qrScaleIn,
  qrSlideUpAndFadeInConfig,
  qrSlideUpAtEnd,
  realQrFadeIn,
  realQrTopGlowFadeIn,
  textSlideUpAtEnd,
  videoFadeOut,
} from 'src/screens/Onboarding/OnboardingCompleteAnimation/animations'
import { flex } from 'src/styles/flex'
import { dimensions } from 'src/styles/sizing'

export function OnboardingCompleteAnimation({
  activeAddress,
  isNewWallet,
  onPressNext,
}: {
  activeAddress: string
  isNewWallet: boolean
  onPressNext: () => void
}) {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const video = useRef<Video>(null)

  const playEtchingAfterSlideIn = () => {
    video.current?.playAsync()
  }

  const isDarkMode = useColorScheme() === 'dark'

  const etchingVideoSource = isDarkMode
    ? ONBOARDING_QR_ETCHING_VIDEO_DARK
    : ONBOARDING_QR_ETCHING_VIDEO_LIGHT

  // 2. QR slide up and fade in animation
  // the config for this animation is defined in the animations.ts file in the same folder as this component, but because of the callback it made more sense to leave the actual animation definition in this file
  const qrSlideUpAndFadeIn: EntryExitAnimationFunction = () => {
    'worklet'
    const animations: AnimateStyle<any> = {
      opacity: withDelay(
        qrSlideUpAndFadeInConfig.opacity.delay,
        withTiming(qrSlideUpAndFadeInConfig.opacity.endValue, {
          duration: qrSlideUpAndFadeInConfig.opacity.duration,
          easing: Easing.bezierFn(0.22, 1.0, 0.36, 1.0),
        })
      ),
      transform: [
        {
          translateY: withDelay(
            qrSlideUpAndFadeInConfig.translateY.delay,
            withTiming(qrSlideUpAndFadeInConfig.translateY.endValue, {
              duration: qrSlideUpAndFadeInConfig.translateY.duration,
              easing: Easing.bezierFn(0.22, 1.0, 0.36, 1.0),
            })
          ),
        },
      ],
    }
    const initialValues: AnimateStyle<any> = {
      opacity: qrSlideUpAndFadeInConfig.opacity.startValue,
      transform: [{ translateY: qrSlideUpAndFadeInConfig.translateY.startValue }],
    }
    const callback = (finished: boolean) => {
      if (finished) {
        runOnJS(playEtchingAfterSlideIn)()
      }
    }
    return {
      initialValues,
      animations,
      callback,
    }
  }

  // 4. QR code inner glow animation
  const reOpacity = useSharedValue(qrInnerBlurConfig.opacity.startValue)
  const preglowBlurOpacity = useValue(qrInnerBlurConfig.opacity.startValue)

  const reSize = useSharedValue(qrInnerBlurConfig.size.startValue)
  const preglowBlurSize = useValue(qrInnerBlurConfig.size.startValue)

  useEffect(() => {
    reOpacity.value = withDelay(
      qrInnerBlurConfig.opacity.delay,
      withTiming(qrInnerBlurConfig.opacity.endValue, {
        duration: qrInnerBlurConfig.opacity.duration,
      })
    )
  }, [reOpacity])

  useEffect(() => {
    reSize.value = withDelay(
      qrInnerBlurConfig.size.delay,
      withTiming(qrInnerBlurConfig.size.endValue, { duration: qrInnerBlurConfig.size.duration })
    )
  }, [reSize])

  // in order to animate React Native Skia values, we need to bind the Reanimated values to the React Native Skia values ("ra" = "reanimated")
  useSharedValueEffect(() => {
    preglowBlurOpacity.current = reOpacity.value
  }, reOpacity)

  useSharedValueEffect(() => {
    preglowBlurSize.current = reSize.value
  }, reSize)

  const uniconColors = useUniconColors(activeAddress)

  // used throughout the page the get the size of the QR code container
  // setting as a constant so that it doesn't get defined by padding and screen size and give us less design control
  const QR_CONTAINER_SIZE = 242
  const QR_CODE_SIZE = 190
  const QR_GLOW_HEIGHT = 120

  const UNICON_SIZE = 48

  // for background glow
  const screenWidth = dimensions.fullWidth

  return (
    <Flex grow justifyContent="space-between" px="md" py="lg">
      <Flex centered grow gap="xl" mb="sm">
        <Flex centered gap="sm" pt="xxl">
          <Animated.View entering={bgGlowTranslateX} style={styles.bgGlowTranslateXStyles}>
            <Canvas style={flex.fill}>
              <Group transform={[{ translateX: 150 }, { translateY: 100 }]}>
                <Oval
                  color={theme.colors.background3}
                  height={screenWidth * 1.1}
                  opacity={1}
                  width={screenWidth * 0.75}
                />
                <Blur blur={100} />
              </Group>
            </Canvas>
          </Animated.View>
          <Animated.View entering={qrSlideUpAndFadeIn}>
            <Animated.View entering={qrSlideUpAtEnd}>
              <Animated.View entering={flashWipeAnimation} style={styles.behindQrBlur}>
                <Canvas style={flex.fill}>
                  <Group transform={[{ translateX: 50 }, { translateY: 50 }]}>
                    <RoundedRect
                      color={uniconColors.glow}
                      height={QR_CONTAINER_SIZE}
                      opacity={1}
                      r={10}
                      width={QR_CONTAINER_SIZE}
                      x={0}
                      y={0}
                    />
                    <Blur blur={25 as unknown as SkiaValue} />
                  </Group>
                </Canvas>
              </Animated.View>
              <Animated.View entering={qrScaleIn}>
                <Box
                  bg="background0"
                  borderColor="backgroundOutline"
                  borderRadius="xl"
                  borderWidth={2}
                  height={QR_CONTAINER_SIZE}
                  overflow="hidden"
                  width={QR_CONTAINER_SIZE}>
                  <Animated.View entering={realQrFadeIn} style={[styles.qrCodeContainer]}>
                    <QRCodeDisplay
                      address={activeAddress}
                      backgroundColor="none"
                      containerBackgroundColor="none"
                      logoSize={UNICON_SIZE}
                      overlayOpacityPercent={10}
                      safeAreaColor="background0"
                      safeAreaSize={UNICON_SIZE + UNICON_SIZE / 2}
                      size={QR_CODE_SIZE}
                    />
                  </Animated.View>
                  <Animated.View entering={realQrTopGlowFadeIn} style={[styles.qrGlow]}>
                    <Flex style={styles.qrGlow}>
                      <Canvas style={flex.fill}>
                        <Group transform={[{ translateX: 0 }, { translateY: -100 }]}>
                          <Oval
                            color={uniconColors.glow}
                            height={QR_GLOW_HEIGHT}
                            opacity={isDarkMode ? 0.6 : 0.4}
                            width={QR_CONTAINER_SIZE}
                          />
                          <Blur blur={25 as unknown as SkiaValue} />
                        </Group>
                      </Canvas>
                    </Flex>
                  </Animated.View>
                </Box>
                <Animated.View entering={videoFadeOut} style={[styles.video]}>
                  <View style={styles.video}>
                    <Video
                      ref={video}
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay={false}
                      source={etchingVideoSource}
                      style={styles.video}
                      useNativeControls={false}
                    />
                  </View>
                </Animated.View>
                <Animated.View entering={videoFadeOut} style={[styles.glow]}>
                  <Canvas style={flex.fill}>
                    <Group
                      transform={[
                        { translateX: QR_CONTAINER_SIZE / 2 - 40 },
                        { translateY: QR_CONTAINER_SIZE / 2 - 40 },
                      ]}>
                      <Oval
                        color={uniconColors.gradientStart}
                        height={80}
                        opacity={preglowBlurOpacity}
                        width={80}
                      />
                      <Blur blur={preglowBlurSize as unknown as SkiaValue} />
                    </Group>
                  </Canvas>
                </Animated.View>
                <Animated.View entering={flashWipeAnimation} style={styles.glow}>
                  <Flex
                    borderRadius="xl"
                    height="100%"
                    style={{ backgroundColor: uniconColors.glow }}
                    width="100%"
                  />
                </Animated.View>
              </Animated.View>
            </Animated.View>
          </Animated.View>
          <Animated.View entering={textSlideUpAtEnd} style={[styles.textContainer]}>
            <Text pb="sm" variant="headlineSmall">
              {t("You're ready to go!")}
            </Text>
            <Text color="textSecondary" textAlign="center" variant="bodyLarge">
              {isNewWallet
                ? t(
                    "You've created, nicknamed, and backed up your wallet. Now, you can explore and transact with the apps, tokens, NFTs, and other wallets that make up the world of web3!"
                  )
                : t(
                    'Check out your tokens and NFTs, watch other wallets, connect to web3 apps, and swap directly in the app.'
                  )}
            </Text>
          </Animated.View>
        </Flex>
      </Flex>
      <Animated.View entering={letsGoButtonFadeIn}>
        <Button label={t('Let’s go')} name={ElementName.Next} onPress={onPressNext} />
      </Animated.View>
    </Flex>
  )
}

const styles = StyleSheet.create({
  behindQrBlur: {
    bottom: -50,
    left: -50,
    position: 'absolute',
    right: -50,
    top: -50,
    zIndex: -1,
  },
  bgGlowTranslateXStyles: {
    bottom: 0,
    left: -250,
    position: 'absolute',
    right: 0,
    top: -500,
    zIndex: -1,
  },
  glow: {
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  qrCodeContainer: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
  },
  qrGlow: {
    borderRadius: 18,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: -1,
    // to make the glow appear behind the QR code
  },
  textContainer: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  video: {
    bottom: 4,
    left: 4,
    position: 'absolute',
    right: 4,
    top: 4,
  },
})
