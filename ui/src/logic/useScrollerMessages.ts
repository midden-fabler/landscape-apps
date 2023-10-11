import { daToUnix } from '@urbit/api';
import bigInt from 'big-integer';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import BTree from 'sorted-btree';

import { STANDARD_MESSAGE_FETCH_PAGE_SIZE } from '@/constants';
import { useChatState, useWritWindow } from '@/state/chat/chat';
import { ChatWrit } from '@/types/chat';

export type ChatWritTree = BTree<bigInt.BigInteger, ChatWrit>;

export type ChatMessageListItemData = {
  writ: ChatWrit;
  type: 'message';
  time: bigInt.BigInteger;
  newAuthor: boolean;
  newDay: boolean;
  whom: string;
  isLast: boolean;
  isLinked: boolean;
  hideReplies: boolean;
};

function useMessageItems({
  messages,
  filterReplies,
}: {
  scrollTo?: bigInt.BigInteger;
  messages: ChatWritTree;
  filterReplies: boolean;
}): [
  bigInt.BigInteger[],
  {
    time: bigInt.BigInteger;
    newAuthor: boolean;
    newDay: boolean;
    writ: ChatWrit;
  }[],
  ChatWritTree
] {
  const filteredMessages = useMemo(
    () =>
      messages.filter((k) => {
        if (!filterReplies) {
          return true;
        }
        return messages.get(k)?.memo.replying === null;
      }),
    [messages, filterReplies]
  );

  const messageDays = useRef(new Map<string, number>());

  function getDay(id: string, time: bigInt.BigInteger) {
    let day = messageDays.current.get(id);
    if (!day) {
      day = new Date(daToUnix(time)).setHours(0, 0, 0, 0);
      messageDays.current.set(id, day);
    }
    return day;
  }

  const [keys, entries] = useMemo(() => {
    const ks: bigInt.BigInteger[] = Array.from(filteredMessages.keys());
    const es = filteredMessages.toArray().map(([key, writ]) => {
      const lastWritKey = filteredMessages.nextLowerKey(key);
      const lastWrit = lastWritKey
        ? filteredMessages.get(lastWritKey)
        : undefined;
      const newAuthor = lastWrit
        ? writ.memo.author !== lastWrit.memo.author ||
          'notice' in lastWrit.memo.content
        : true;
      const newDay =
        !lastWritKey ||
        !lastWrit ||
        !(getDay(lastWrit?.seal.id, lastWritKey) === getDay(writ.seal.id, key));
      return {
        writ,
        time: key,
        newAuthor,
        newDay,
      };
    }, []);
    return [ks, es];
  }, [filteredMessages]);

  return useMemo(
    () => [keys, entries, filteredMessages],
    [keys, entries, filteredMessages]
  );
}

export type MessageFetchState = 'top' | 'bottom' | 'initial';

const DEBUG_FETCH = true;

function fetchDebugMessage(...args: unknown[]) {
  if (DEBUG_FETCH) {
    console.log('[useFetchMessages]', ...args);
  }
}

export default function useFetchMessages({
  whom,
  messages,
  scrollTo,
}: {
  whom: string;
  messages: ChatWritTree;
  scrollTo?: bigInt.BigInteger;
}) {
  const writWindow = useWritWindow(whom, scrollTo);
  const [fetchState, setFetchState] = useState<MessageFetchState>('initial');

  const fetchMessages = useCallback(
    async (newer: boolean, pageSize = STANDARD_MESSAGE_FETCH_PAGE_SIZE) => {
      fetchDebugMessage(
        'fetchMessages',
        newer ? 'newer' : 'older',
        'whom',
        whom,
        'scrolTo',
        scrollTo,
        pageSize
      );

      const newest = messages.maxKey();
      const seenNewest =
        newer && newest && writWindow && writWindow.loadedNewest;
      const oldest = messages.minKey();
      const seenOldest =
        !newer && oldest && writWindow && writWindow.loadedOldest;

      if (seenNewest || seenOldest) {
        fetchDebugMessage('skipping fetch, seen', newer ? 'newest' : 'oldest');
        return;
      }

      try {
        setFetchState(newer ? 'bottom' : 'top');
        if (newer) {
          fetchDebugMessage('load newer');
          const result = await useChatState
            .getState()
            .fetchMessages(whom, pageSize.toString(), 'newer', scrollTo);
          fetchDebugMessage('load result', result);
        } else {
          fetchDebugMessage('load older');
          const result = await useChatState
            .getState()
            .fetchMessages(whom, pageSize.toString(), 'older', scrollTo);
          fetchDebugMessage('load result', result);
        }

        setFetchState('initial');
      } catch (e) {
        setFetchState('initial');
      }
    },
    [whom, messages, scrollTo, writWindow]
  );

  return useMemo(
    () => ({
      fetchMessages,
      fetchState,
      // If there's no writWindow, we've loaded the newest we can load
      hasLoadedNewest: writWindow?.loadedNewest ?? true,
      hasLoadedOldest: writWindow?.loadedOldest ?? true,
    }),
    [fetchMessages, fetchState, writWindow]
  );
}

export function useMessageData({
  whom,
  scrollTo,
  messages,
  replying,
}: {
  whom: string;
  scrollTo?: bigInt.BigInteger;
  messages: ChatWritTree;
  replying: boolean;
}) {
  const [activeMessageKeys, messageEntries, activeMessages] = useMessageItems({
    messages,
    filterReplies: !replying,
  });

  const activeMessageEntries: ChatMessageListItemData[] = useMemo(
    () =>
      messageEntries.map((props, index) => ({
        type: 'message',
        whom,
        isLast: index === messageEntries.length - 1,
        isLinked: !!scrollTo && (props.time?.eq(scrollTo) ?? false),
        hideReplies: replying,
        ...props,
      })),
    [whom, scrollTo, messageEntries, replying]
  );

  const { fetchMessages, fetchState, hasLoadedNewest, hasLoadedOldest } =
    useFetchMessages({
      whom,
      messages,
      scrollTo,
    });

  return {
    activeMessages,
    activeMessageKeys,
    activeMessageEntries,
    fetchMessages,
    fetchState,
    hasLoadedNewest,
    hasLoadedOldest: replying ? true : hasLoadedOldest,
  };
}
