import { Trans } from '@lingui/macro'
import { friendsActivity, useAllFriendsBuySells } from 'components/SocialFeed/hooks'
import { Unicon } from 'components/Unicon'
import useENSAvatar from 'hooks/useENSAvatar'
import { getTimeDifference } from 'nft/utils/date'
import React from 'react'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { shortenAddress } from 'utils'

export const ExploreContainer = styled.div`
  width: 100%;
  min-width: 320px;
  padding: 68px 12px 0px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding-top: 48px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }
`
const TitleContainer = styled.div`
  margin-bottom: 32px;
  max-width: ${({ theme }) => theme.breakpoint.lg};
  margin-left: auto;
  margin-right: auto;
  display: flex;
`

const FeedContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  max-width: ${({ theme }) => theme.breakpoint.lg};

  margin-left: auto;
  margin-right: auto;

  justify-content: flex-start;
  align-items: flex-start;
`

const ActivityCard = styled.div`
  display: flex;
  flex-direction: column;

  gap: 20px;
  padding: 20px;
  width: 500px;

  background-color: ${({ theme }) => theme.surface1};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.surface3};
`
const CardHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20px;
  justify-content: space-between;
  white-space: nowrap;
`

const Who = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  width: 100%;
`

const ENSAvatarImg = styled.img`
  border-radius: 8px;
  height: 30px;
  width: 30px;
`
function PortfolioAvatar({ accountAddress }: { accountAddress: string }) {
  const { avatar, loading } = useENSAvatar(accountAddress, false)

  // if (loading) {
  //   return <Loader size={size} />
  // }
  if (avatar) {
    return <ENSAvatarImg src={avatar} alt="avatar" />
  }
  return <Unicon size={30} address={accountAddress} />
}

const ActivityFeed = () => {
  console.log(useAllFriendsBuySells())
  return (
    <ExploreContainer>
      <TitleContainer>
        <ThemedText.LargeHeader>
          <Trans>Feed</Trans>
        </ThemedText.LargeHeader>
      </TitleContainer>
      <FeedContainer>
        {friendsActivity
          .sort((a, b) => b.timestamp - a.timestamp)
          .map((activity, index) => {
            return (
              <ActivityCard key={index}>
                <CardHeader>
                  <Who>
                    <PortfolioAvatar accountAddress={activity.address} />
                    <ThemedText.BodyPrimary>
                      {activity.ensName ?? shortenAddress(activity.address)}
                    </ThemedText.BodyPrimary>
                  </Who>
                  <ThemedText.LabelSmall>{getTimeDifference(activity.timestamp.toString())}</ThemedText.LabelSmall>
                </CardHeader>
                <ThemedText.BodySecondary>{activity.description}</ThemedText.BodySecondary>
                {activity.image && (
                  <img src={activity.image} alt="activity image" style={{ maxHeight: '100%', maxWidth: '100%' }} />
                )}
              </ActivityCard>
            )
          })}
      </FeedContainer>
    </ExploreContainer>
  )
}

export default ActivityFeed