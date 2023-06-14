/* eslint-disable react/no-unused-prop-types */
import React from 'react';
import { BigInteger } from 'big-integer';
import { daToUnix } from '@urbit/api';
import { format } from 'date-fns';
import Author from '@/chat/ChatMessage/Author';
// eslint-disable-next-line import/no-cycle
import ChatContent from '@/chat/ChatContent/ChatContent';
import DateDivider from '@/chat/ChatMessage/DateDivider';
import { DiaryQuip } from '@/types/diary';
import { ChatBlock, ChatStory } from '@/types/chat';
import { useChannelFlag } from '@/logic/channel';
import DiaryCommentOptions from './DiaryCommentOptions';
import QuipReactions from './QuipReactions/QuipReactions';

export interface DiaryCommentProps {
  noteId: string;
  time: BigInteger;
  quip: DiaryQuip;
  newAuthor: boolean;
  newDay: boolean;
  unreadCount?: number;
}

const DiaryComment = React.memo<
  DiaryCommentProps & React.RefAttributes<HTMLDivElement>
>(
  React.forwardRef<HTMLDivElement, DiaryCommentProps>(
    (
      { noteId, time, quip, unreadCount, newAuthor, newDay }: DiaryCommentProps,
      ref
    ) => {
      const { cork, memo } = quip;
      const flag = useChannelFlag();
      const unix = new Date(daToUnix(time));
      const normalizedContent: ChatStory = {
        ...memo.content,
        block: memo.content.block.filter(
          (b) => 'image' in b || 'cite' in b
        ) as ChatBlock[],
      };

      return (
        <div ref={ref} className="flex flex-col">
          {typeof unreadCount === 'number' ? (
            <DateDivider date={unix} unreadCount={unreadCount} />
          ) : null}
          {newDay && typeof unreadCount === 'undefined' ? (
            <DateDivider date={unix} />
          ) : null}
          {newAuthor ? <Author ship={memo.author} date={unix} /> : null}
          <div className="group-one relative z-0 flex">
            <DiaryCommentOptions
              whom={flag || ''}
              noteId={noteId}
              quip={quip}
              time={time.toString()}
            />
            <div className="-ml-1 mr-1 py-2 text-xs font-semibold text-gray-400 opacity-0 group-one-hover:opacity-100">
              {format(unix, 'HH:mm')}
            </div>
            <div className="flex w-full flex-col space-y-2 rounded py-1 pl-3 pr-2 group-one-hover:bg-gray-50">
              <ChatContent story={normalizedContent} />
              {Object.keys(cork.feels).length > 0 && (
                <QuipReactions
                  time={time.toString()}
                  whom={flag || ''}
                  cork={cork}
                  noteId={noteId}
                />
              )}
            </div>
          </div>
        </div>
      );
    }
  )
);

export default DiaryComment;
