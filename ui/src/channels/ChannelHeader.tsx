import React, { PropsWithChildren } from 'react';
import cn from 'classnames';
import { useIsMobile } from '@/logic/useMedia';
import { useChannel, useAmAdmin, useGroup } from '@/state/groups';
import ReconnectingSpinner from '@/components/ReconnectingSpinner';
import MobileHeader from '@/components/MobileHeader';
import { getFlagParts, isTalk } from '@/logic/utils';
import { useConnectivityCheck } from '@/state/vitals';
import ChannelActions from './ChannelActions';
import ChannelTitleButton from './ChannelTitleButton';
import HostConnection from './HostConnection';
import ChannelIcon from './ChannelIcon';

export type ChannelHeaderProps = PropsWithChildren<{
  flag: string;
  nest: string;
  prettyAppName: string;
  leave: (flag: string) => Promise<void>;
}>;

export default function ChannelHeader({
  flag,
  nest,
  prettyAppName,
  leave,
  children,
}: ChannelHeaderProps) {
  const isMobile = useIsMobile();
  const channel = useChannel(flag, nest);
  const isAdmin = useAmAdmin(flag);
  const group = useGroup(flag);
  const host = getFlagParts(flag).ship;
  const { data } = useConnectivityCheck(host);
  const saga = group?.saga || null;

  if (isMobile) {
    return (
      <MobileHeader
        title={<ChannelIcon nest={nest} className="h-6 w-6 text-gray-600" />}
        secondaryTitle={
          <ChannelActions {...{ nest, prettyAppName, channel, isAdmin, leave }}>
            <h1 className="flex max-w-xs items-center truncate px-4 text-[18px] leading-5 text-gray-800">
              {channel?.meta.title}
              <HostConnection
                className="ml-1 inline-flex"
                ship={host}
                status={data?.status}
                saga={saga}
              />
            </h1>
          </ChannelActions>
        }
        action={
          <div className="flex h-12 flex-row items-center justify-end space-x-2">
            <ReconnectingSpinner />
            {children}
          </div>
        }
        pathBack={isTalk ? '/' : `/groups/${flag}`}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between border-b-2 border-gray-50 bg-white py-2 pl-2 pr-4'
      )}
    >
      <ChannelTitleButton flag={flag} nest={nest} />
      <div className="flex shrink-0 flex-row items-center space-x-3">
        {isMobile && <ReconnectingSpinner />}
        {children}
        <ChannelActions {...{ nest, prettyAppName, channel, isAdmin, leave }} />
      </div>
    </div>
  );
}
