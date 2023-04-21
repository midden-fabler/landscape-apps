import React, { useCallback, useEffect, useRef, useState } from 'react';
import _ from 'lodash';
import ob from 'urbit-ob';
import cn from 'classnames';
import { useLocation, useNavigate, useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { VirtuosoHandle } from 'react-virtuoso';
import { useEventListener } from 'usehooks-ts';
import bigInt from 'big-integer';
import { useChannelFlag } from '@/hooks';
import { useChatState, useReplies, useWrit, useChatPerms } from '@/state/chat';
import { useChannel, useRouteGroup, useVessel } from '@/state/groups/groups';
import ChatInput from '@/chat/ChatInput/ChatInput';
import BranchIcon from '@/components/icons/BranchIcon';
import X16Icon from '@/components/icons/X16Icon';
import ChatScroller from '@/chat/ChatScroller/ChatScroller';
import { whomIsFlag } from '@/logic/utils';
import useLeap from '@/components/Leap/useLeap';
import CaretLeft16Icon from '@/components/icons/CaretLeft16Icon';
import { useIsMobile } from '@/logic/useMedia';
import keyMap from '@/keyMap';
import ChatScrollerPlaceholder from '../ChatScoller/ChatScrollerPlaceholder';

export default function ChatThread() {
  const { name, chShip, ship, chName, idTime, idShip } = useParams<{
    name: string;
    chShip: string;
    ship: string;
    chName: string;
    idShip: string;
    idTime: string;
  }>();
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();
  const scrollerRef = useRef<VirtuosoHandle>(null);
  const flag = useChannelFlag()!;
  const whom = flag || ship || '';
  const groupFlag = useRouteGroup();
  const { sendMessage } = useChatState.getState();
  const location = useLocation();
  const scrollTo = new URLSearchParams(location.search).get('msg');
  const channel = useChannel(groupFlag, `chat/${flag}`)!;
  const { isOpen: leapIsOpen } = useLeap();
  const id = `${idShip!}/${idTime!}`;
  const maybeWrit = useWrit(whom, id);
  const replies = useReplies(whom, id);
  const navigate = useNavigate();
  const [time, writ] = maybeWrit ?? [null, null];
  const threadRef = useRef<HTMLDivElement | null>(null);
  const perms = useChatPerms(flag);
  const vessel = useVessel(groupFlag, window.our);
  const isClub = ship ? (ob.isValidPatp(ship) ? false : true) : false;
  const club = ship && isClub ? useChatState.getState().multiDms[ship] : null;
  const threadTitle = whomIsFlag(whom)
    ? channel?.meta?.title || ''
    : isClub
    ? club?.meta.title || ship
    : ship;
  const canWrite =
    perms.writers.length === 0 ||
    _.intersection(perms.writers, vessel.sects).length !== 0;

  const returnURL = useCallback(() => {
    if (!time || !writ) return '#';

    if (location.pathname.includes('groups')) {
      return `/groups/${ship}/${name}/channels/chat/${chShip}/${chName}?msg=${time.toString()}`;
    }
    return `/dm/${ship}?msg=${time.toString()}`;
  }, [chName, chShip, location, name, ship, time, writ]);

  const onEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === keyMap.thread.close && !leapIsOpen) {
        navigate(returnURL());
      }
    },
    [navigate, returnURL, leapIsOpen]
  );

  useEventListener('keydown', onEscape, threadRef);

  const initializeChannel = useCallback(async () => {
    setLoading(true);
    await useChatState.getState().initialize(`${chShip}/${chName}`);
    setLoading(false);
  }, [chName, chShip]);

  useEffect(() => {
    if (!time || !writ) {
      initializeChannel();
    }
  }, [initializeChannel, time, writ]);

  if (!time || !writ) return null;

  const thread = replies.set(time, writ);
  const BackButton = isMobile ? Link : 'div';

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-y-auto  bg-white lg:w-96 lg:border-l-2 lg:border-gray-50"
      ref={threadRef}
    >
      <header className={'header z-40'}>
        <div
          className={cn(
            'flex items-center justify-between border-b-2 border-gray-50 bg-white px-6 py-4 sm:px-4'
          )}
        >
          <BackButton to={returnURL()} aria-label="Close" className="">
            <div className="flex items-center">
              {isMobile && (
                <CaretLeft16Icon className="mr-2 h-4 w-4 text-gray-400" />
              )}
              <div className="mr-3 flex h-6 w-6 items-center justify-center rounded bg-gray-100 p-1">
                <BranchIcon className="h-4 w-4 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold line-clamp-1 sm:text-base sm:font-semibold">
                Thread: {threadTitle}
              </h3>
            </div>
          </BackButton>

          {!isMobile && (
            <Link
              to={returnURL()}
              aria-label="Close"
              className="icon-button h-6 w-6 bg-transparent"
            >
              <X16Icon className="h-4 w-4 text-gray-400" />
            </Link>
          )}
        </div>
      </header>
      <div className="flex flex-1 flex-col p-0 pr-2">
        {loading ? (
          <ChatScrollerPlaceholder count={30} />
        ) : (
          <ChatScroller
            key={idTime}
            messages={thread}
            whom={whom}
            scrollerRef={scrollerRef}
            replying
            scrollTo={scrollTo ? bigInt(scrollTo) : undefined}
          />
        )}
      </div>
      <div className="sticky bottom-0 border-t-2 border-gray-50 bg-white p-4">
        {canWrite && (
          <ChatInput
            whom={whom}
            replying={id}
            sendMessage={sendMessage}
            inThread
            autoFocus
          />
        )}
      </div>
    </div>
  );
}
