import React, { useEffect } from 'react';
import cookies from 'browser-cookies';
import { Outlet, useMatch, useNavigate } from 'react-router';
import _ from 'lodash';
import {
  useGang,
  useGroup,
  useGroupConnection,
  useGroupConnectionState,
  useGroupHostHi,
  useRouteGroup,
  useVessel,
} from '@/state/groups/groups';
import { useChatState } from '@/state/chat';
import { useHeapBriefs } from '@/state/heap/heap';
import { useDiaryBriefs } from '@/state/diary';
import { useIsMobile } from '@/logic/useMedia';
import useRecentChannel from '@/logic/useRecentChannel';
import { canReadChannel, getFlagParts } from '@/logic/utils';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import { useGroupsAnalyticsEvent } from '@/logic/useAnalyticsEvent';
import useGroupPrivacy from '@/logic/useGroupPrivacy';

function Groups() {
  const navigate = useNavigate();
  const hasUsedGroupsCount = parseInt(cookies.get('hasUsedGroups') || '0', 10);
  const flag = useRouteGroup();
  const group = useGroup(flag, true);
  const gang = useGang(flag);
  const { privacy } = useGroupPrivacy(flag);
  const { ship } = getFlagParts(flag);
  const { isError, isSuccess, isLoading } = useGroupHostHi(flag);
  const diaryBriefs = useDiaryBriefs();
  const heapBriefs = useHeapBriefs();
  const connection = useGroupConnection(flag);
  const vessel = useVessel(flag, window.our);
  const isMobile = useIsMobile();
  const root = useMatch({
    path: '/groups/:ship/:name',
    end: true,
  });
  const { recentChannel } = useRecentChannel(flag);

  useEffect(() => {
    if (group) {
      useGroupConnectionState.getState().setGroupConnected(flag, true);
      return;
    }

    if (isLoading && !connection) {
      useGroupConnectionState.getState().setGroupConnected(flag, true);
    }
    if (isError && connection) {
      useGroupConnectionState.getState().setGroupConnected(flag, false);
    }
    if (isSuccess && !connection) {
      useGroupConnectionState.getState().setGroupConnected(flag, true);
    }
  }, [isError, isSuccess, isLoading, flag, group, connection]);

  useEffect(() => {
    // 1) If we've initialized and the group doesn't exist and you don't have
    // an invite to it, navigate back to home.
    // 2) If we've initialized and we have a group and we're at the root of
    // that group (/~ship/group-name), then check if we have stored a "recent
    // channel" for that group that matches one of the group's current channels.
    // 3) If we found a channel that matches what we have for "recent channel"
    // and you can read that channel (and you're not on mobile), navigate
    // directly to that channel.
    // 4) If we don't have a recent channel, grab a channel from our briefs for
    // that group, check if we can read it, and if we're not on mobile, then
    // navigate to that channel.
    // 5) If we're on mobile, just navigate to the channel list for the group.

    if (!group && !gang) {
      navigate('/');
    } else if (group && root) {
      cookies.set('hasUsedGroups', (hasUsedGroupsCount + 1).toString());

      const found = Object.entries(group.channels).find(
        ([nest, _c]) => recentChannel === nest
      );

      let canRead = found && canReadChannel(found[1], vessel, group?.bloc);
      if (recentChannel && canRead && !isMobile) {
        navigate(`./channels/${recentChannel}`, { replace: true });
        return;
      }

      // done this way to prevent too many renders from useAllBriefs
      const allBriefs = {
        ..._.mapKeys(useChatState.getState().briefs, (v, k) => `chat/${k}`),
        // ..._.mapKeys(useHeapState.getState().briefs, (v, k) => `heap/${k}`),
        ..._.mapKeys(heapBriefs, (k, v) => `heap/${k}`),
        ..._.mapKeys(diaryBriefs, (v, k) => `diary/${k}`),
      };
      const channel = Object.entries(group.channels).find(
        ([nest]) => nest in allBriefs
      );

      canRead = channel && canReadChannel(channel[1], vessel, group?.bloc);
      if (channel && canRead && !isMobile) {
        navigate(`./channels/${channel[0]}`, { replace: true });
      } else if (!isMobile) {
        navigate('./channels', { replace: true });
      }
    }
  }, [
    root,
    gang,
    group,
    vessel,
    isMobile,
    recentChannel,
    navigate,
    diaryBriefs,
    heapBriefs,
    hasUsedGroupsCount,
  ]);

  useGroupsAnalyticsEvent({
    name: 'open_group',
    leaveName: 'leave_group',
    groupFlag: flag,
    privacy,
  });

  if (!connection && !group) {
    return (
      <div className="flex min-w-0 grow items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center justify-center space-y-4">
          <span className="ml-2 text-gray-600">
            Group host ({ship}) is offline.
          </span>
        </div>
      </div>
    );
  }

  if (!group || group.meta.title === '') {
    return (
      <div className="flex min-w-0 grow items-center justify-center bg-gray-50">
        <div className="items-top mx-6 flex max-w-prose justify-center">
          <LoadingSpinner className="h-4 w-4 text-gray-400" />
          <span className="ml-3 text-gray-600">
            Fetching messages from group host. This might take a minute...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        marginBottom: -50,
      }}
      className="flex h-full w-full min-w-0 flex-col sm:flex-row"
    >
      <Outlet />
    </div>
  );
}

export default Groups;
