import React, { PropsWithChildren } from 'react';
import cn from 'classnames';
import { useIsMobile } from '@/logic/useMedia';
import { useChannel, useAmAdmin, useGroup } from '@/state/groups';
import ReconnectingSpinner from '@/components/ReconnectingSpinner';
import MobileHeader from '@/components/MobileHeader';
import { getFlagParts, isTalk } from '@/logic/utils';
import { useConnectivityCheck } from '@/state/vitals';
import ChannelActions, { ChannelActionsProps } from './ChannelActions';
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
  const actionProps: ChannelActionsProps = {
    nest,
    prettyAppName,
    channel,
    isAdmin,
    leave,
    saga,
    status: data?.status,
  };

  if (isMobile) {
    return (
      <MobileHeader
        title={
          <ChannelActions
            {...actionProps}
            className="flex max-w-full items-center justify-center"
          >
            <ChannelIcon
              nest={nest}
              className="h-6 w-6 flex-none text-gray-600"
            />
            <h1 className="ml-2 flex flex-1 items-center overflow-hidden text-[17px] leading-5 text-gray-800">
              <span className="truncate">{channel?.meta.title}</span>
            </h1>
            <HostConnection
              className="ml-1 inline-flex flex-none"
              ship={host}
              status={data?.status}
              saga={saga}
            />
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
        <ChannelActions {...actionProps} />
      </div>
    </div>
  );
}
