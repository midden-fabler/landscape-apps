import React from 'react';
import { differenceInDays } from 'date-fns';
import { BigIntOrderedMap, daToUnix } from '@urbit/api';

import ChatMessage, { ChatMessageProps } from './ChatMessage/ChatMessage';
import { ChatWrit } from '../types/chat';
import { useChatInfo } from './useChatStore';
import ChatNotice from './ChatNotice';
import { useChatState } from '../state/chat';

interface ChatMessagesProps
  extends Omit<
    ChatMessageProps,
    'writ' | 'newAuthor' | 'newDay' | 'time' | 'whom'
  > {
  whom: string;

  messages: BigIntOrderedMap<ChatWrit>;
  replying?: boolean;
}

export default function ChatMessages(props: ChatMessagesProps) {
  const { messages, whom, replying = false, ...rest } = props;
  const chatInfo = useChatInfo(whom);
  const brief = useChatState((s) => s.briefs[whom]);

  const keys = messages
    .keys()
    .reverse()
    .filter((k) => {
      if (replying) {
        return true;
      }
      return messages.get(k)!.memo.replying === null;
    });

  return (
    <>
      {keys.map((key, index) => {
        const writ = messages.get(key);
        const lastWritKey = index > 0 ? keys[index - 1] : undefined;
        const lastWrit = lastWritKey ? messages.get(lastWritKey) : undefined;
        const newAuthor = lastWrit
          ? writ.memo.author !== lastWrit.memo.author
          : true;
        const writDay = new Date(daToUnix(key));

        const lastWritDay = lastWritKey
          ? new Date(daToUnix(lastWritKey))
          : undefined;
        const newDay =
          lastWrit && lastWritDay
            ? differenceInDays(writDay, lastWritDay) > 0
            : false;
        const isNotice = 'notice' in writ.memo.content;
        if (isNotice) {
          return <ChatNotice key={writ.seal.id} writ={writ} />;
        }

        return (
          <ChatMessage
            key={writ.seal.id}
            {...rest}
            whom={whom}
            isReplyOp={chatInfo?.replying === writ.seal.id}
            writ={writ}
            time={key}
            newAuthor={newAuthor}
            newDay={newDay}
            unread={
              brief && brief['read-id'] === writ.seal.id ? brief : undefined
            }
          />
        );
      })}
    </>
  );
}
