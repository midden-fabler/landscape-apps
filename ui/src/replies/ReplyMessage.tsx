/* eslint-disable react/no-unused-prop-types */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import cn from 'classnames';
import debounce from 'lodash/debounce';
import { BigInteger } from 'big-integer';
import { daToUnix } from '@urbit/api';
import { format } from 'date-fns';
import { useParams } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { DMUnread } from '@/types/dms';
import Author from '@/chat/ChatMessage/Author';
// eslint-disable-next-line import/no-cycle
import ChatContent from '@/chat/ChatContent/ChatContent';
import DateDivider from '@/chat/ChatMessage/DateDivider';
import {
  useChatState,
  useTrackedMessageStatus,
  // useIsMessageDelivered,
  // useIsMessagePosted,
} from '@/state/chat';
import DoubleCaretRightIcon from '@/components/icons/DoubleCaretRightIcon';
import UnreadIndicator from '@/components/Sidebar/UnreadIndicator';
import { useIsMobile } from '@/logic/useMedia';
import useLongPress from '@/logic/useLongPress';
import {
  useMarkReadMutation,
  useTrackedPostStatus,
} from '@/state/channel/channel';
import { emptyReply, Reply } from '@/types/channel';
import { useIsDmOrMultiDm } from '@/logic/utils';
import {
  useChatDialog,
  useChatHovering,
  useChatInfo,
  useChatStore,
} from '@/chat/useChatStore';
import ReactionDetails from '@/chat/ChatReactions/ReactionDetails';
import ReplyReactions from './ReplyReactions/ReplyReactions';
import ReplyMessageOptions from './ReplyMessageOptions';

export interface ReplyMessageProps {
  whom: string;
  time: BigInteger;
  reply: Reply;
  newAuthor?: boolean;
  newDay?: boolean;
  hideOptions?: boolean;
  isLast?: boolean;
  isLinked?: boolean;
  isScrolling?: boolean;
  showReply?: boolean;
}

function unreadMatches(unread: DMUnread, id: string): boolean {
  return unread['read-id'] === id;
}

const mergeRefs =
  (...refs: any[]) =>
  (node: any) => {
    refs.forEach((ref) => {
      if (!ref) {
        return;
      }

      /* eslint-disable-next-line no-param-reassign */
      ref.current = node;
    });
  };

const ReplyMessage = React.memo<
  ReplyMessageProps & React.RefAttributes<HTMLDivElement>
>(
  React.forwardRef<HTMLDivElement, ReplyMessageProps>(
    (
      {
        whom,
        time,
        reply,
        newAuthor = false,
        newDay = false,
        hideOptions = false,
        isLast = false,
        isLinked = false,
        isScrolling = false,
        showReply = false,
      }: ReplyMessageProps,
      ref
    ) => {
      const { seal, memo } = reply ?? emptyReply;
      const container = useRef<HTMLDivElement>(null);
      const isThreadOp = seal['parent-id'] === seal.id;
      const isMobile = useIsMobile();
      const isThreadOnMobile = isMobile;
      const chatInfo = useChatInfo(whom);
      const unread = chatInfo?.unread;
      const unreadId = unread?.unread['read-id'];
      const { hovering, setHovering } = useChatHovering(whom, seal.id);
      const { open: pickerOpen } = useChatDialog(whom, seal.id, 'picker');
      const isDMOrMultiDM = useIsDmOrMultiDm(whom);
      const { mutate: markChatRead } = useMarkReadMutation();
      const { ref: viewRef } = useInView({
        threshold: 1,
        onChange: useCallback(
          (inView: boolean) => {
            // if no tracked unread we don't need to take any action
            if (!unread) {
              return;
            }

            const { unread: brief, seen } = unread;
            /* the first fire of this function
               which we don't to do anything with. */
            if (!inView && !seen) {
              return;
            }

            const {
              seen: markSeen,
              read,
              delayedRead,
            } = useChatStore.getState();
            const { markDmRead } = useChatState.getState();

            /* once the unseen marker comes into view we need to mark it
               as seen and start a timer to mark it read so it goes away.
               we ensure that the brief matches and hasn't changed before
               doing so. we don't want to accidentally clear unreads when
               the state has changed
            */
            if (inView && unreadMatches(brief, seal.id) && !seen) {
              markSeen(whom);
              delayedRead(whom, () => {
                if (isDMOrMultiDM) {
                  markDmRead(whom);
                } else {
                  markChatRead({ nest: whom });
                }
              });
              return;
            }

            /* finally, if the marker transitions back to not being visible,
              we can assume the user is done and clear the unread. */
            if (!inView && unread && seen) {
              read(whom);
              markDmRead(whom);
            }
          },
          [unread, whom, seal.id, isDMOrMultiDM, markChatRead]
        ),
      });

      const msgStatus = useTrackedMessageStatus(seal.id);
      const status = useTrackedPostStatus({
        author: window.our,
        sent: memo.sent,
      });
      const isDelivered = msgStatus === 'delivered' && status === 'delivered';
      const isSent = msgStatus === 'sent' || status === 'sent';
      const isPending = msgStatus === 'pending' || status === 'pending';

      const isReplyOp = chatInfo?.replying === seal.id;

      const unix = new Date(daToUnix(time));

      const hover = useRef(false);
      const setHover = useRef(
        debounce(() => {
          if (hover.current) {
            setHovering(true);
          }
        }, 100)
      );
      const onOver = useCallback(() => {
        // If we're already hovering, don't do anything
        // If we're the thread op and this isn't on mobile, don't do anything
        // This is necessary to prevent the hover from appearing
        // in the thread when the user hovers in the main scroll window.
        if (hover.current === false && (!isThreadOp || isThreadOnMobile)) {
          hover.current = true;
          setHover.current();
        }
      }, [isThreadOp, isThreadOnMobile]);
      const onOut = useRef(
        debounce(
          () => {
            hover.current = false;
            setHovering(false);
          },
          50,
          { leading: true }
        )
      );

      const [optionsOpen, setOptionsOpen] = useState(false);
      const [reactionDetailsOpen, setReactionDetailsOpen] = useState(false);
      const { action, actionId, handlers } = useLongPress({ withId: true });

      useEffect(() => {
        if (!isMobile) {
          return;
        }

        if (action === 'longpress') {
          if (actionId === 'reactions-target') {
            setReactionDetailsOpen(true);
          } else {
            setOptionsOpen(true);
          }
        }
      }, [action, actionId, isMobile]);

      useEffect(() => {
        if (isMobile) {
          return;
        }

        // If we're the thread op, don't show options.
        // Options are shown for the threadOp in the main scroll window.
        setOptionsOpen(
          (hovering || pickerOpen) &&
            !hideOptions &&
            !isScrolling &&
            !isThreadOp
        );
      }, [
        isMobile,
        hovering,
        pickerOpen,
        hideOptions,
        isScrolling,
        isThreadOp,
      ]);

      if (!reply) {
        return null;
      }

      return (
        <div
          ref={mergeRefs(ref, container)}
          className={cn('flex flex-col break-words', {
            'pt-3': newAuthor,
            'pb-2': isLast,
          })}
          onMouseEnter={onOver}
          onMouseLeave={onOut.current}
          data-testid="chat-message"
          id="chat-message-target"
          {...handlers}
        >
          {unread && unreadMatches(unread.unread, seal.id) ? (
            <DateDivider
              date={unix}
              unreadCount={unread.unread.count}
              ref={viewRef}
            />
          ) : null}
          {newDay ? <DateDivider date={unix} /> : null}
          {newAuthor ? (
            <Author ship={memo.author} date={unix} hideRoles />
          ) : null}
          <div className="group-one relative z-0 flex w-full select-none sm:select-auto">
            <ReplyMessageOptions
              open={optionsOpen}
              onOpenChange={setOptionsOpen}
              whom={whom}
              reply={reply}
              showReply={showReply}
              openReactionDetails={() => setReactionDetailsOpen(true)}
            />
            <div className="-ml-1 mr-1 py-2 text-xs font-semibold text-gray-400 opacity-0 sm:group-one-hover:opacity-100">
              {format(unix, 'HH:mm')}
            </div>
            <div className="wrap-anywhere flex w-full">
              <div
                className={cn(
                  'flex w-full min-w-0 grow flex-col space-y-2 rounded py-1 pl-3 pr-2 sm:group-one-hover:bg-gray-50',
                  isReplyOp && 'bg-gray-50',
                  isPending && 'text-gray-400',
                  isLinked && 'bg-blue-softer'
                )}
              >
                {memo.content ? (
                  <ChatContent
                    story={memo.content}
                    isScrolling={isScrolling}
                    writId={seal.id}
                  />
                ) : null}
                {seal.reacts && Object.keys(seal.reacts).length > 0 && (
                  <>
                    <ReplyReactions
                      id="reactions-target"
                      seal={seal}
                      whom={whom}
                      time={time.toString()}
                    />
                    <ReactionDetails
                      open={reactionDetailsOpen}
                      onOpenChange={setReactionDetailsOpen}
                      reactions={seal.reacts}
                    />
                  </>
                )}
              </div>
              <div className="relative flex w-5 items-end rounded-r sm:group-one-hover:bg-gray-50">
                {!isDelivered && (
                  <DoubleCaretRightIcon
                    className="absolute left-0 bottom-2 h-5 w-5"
                    primary={isSent ? 'text-black' : 'text-gray-200'}
                    secondary="text-gray-200"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
  )
);

export default ReplyMessage;
