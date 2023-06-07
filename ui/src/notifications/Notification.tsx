import cn from 'classnames';
import _ from 'lodash';
import React, { ReactNode, useCallback } from 'react';
import ob from 'urbit-ob';
import { Link } from 'react-router-dom';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import Bullet16Icon from '@/components/icons/Bullet16Icon';
import CaretDown16Icon from '@/components/icons/CaretDown16Icon';
import ShipName from '@/components/ShipName';
import { makePrettyTime, PUNCTUATION_REGEX } from '@/logic/utils';
import { useSawRopeMutation } from '@/state/hark';
import { Skein, YarnContent } from '@/types/hark';
import { useChatState } from '@/state/chat';
import { isComment, isMention, isReply } from './useNotifications';

interface NotificationProps {
  bin: Skein;
  topLine?: ReactNode;
  avatar?: ReactNode;
}

interface NotificationContentProps {
  content: YarnContent[];
  time: number;
  conIsMention: boolean;
  conIsReply: boolean;
  conIsComment: boolean;
}

function NotificationContent({
  content,
  time,
  conIsMention,
  conIsReply,
  conIsComment,
}: NotificationContentProps) {
  function renderContent(c: YarnContent, i: number) {
    if (typeof c === 'string') {
      return (
        <span key={`${c}-${time}-${i}`}>
          {c.split(' ').map((s, index) =>
            ob.isValidPatp(s.replaceAll(PUNCTUATION_REGEX, '')) ? (
              <span
                key={`${s}-${index}`}
                className="mr-1 inline-block rounded bg-blue-soft px-1.5 py-0 text-blue mix-blend-multiply dark:mix-blend-normal"
              >
                <ShipName name={s.replaceAll(PUNCTUATION_REGEX, '')} />
              </span>
            ) : (
              <span className="break-word text-ellipsis" key={`${s}-${index}`}>
                {s}{' '}
              </span>
            )
          )}
        </span>
      );
    }

    if ('ship' in c) {
      return (
        <ShipName
          key={c.ship + time}
          name={c.ship}
          className="font-semibold text-gray-800"
          showAlias={true}
        />
      );
    }

    return <span key={c.emph + time}>&ldquo;{c.emph}&rdquo;</span>;
  }

  if (conIsMention) {
    return (
      <>
        <p className="mb-2 leading-5 text-gray-400 line-clamp-2">
          {_.map(_.slice(content, 0, 2), (c: YarnContent, i) =>
            renderContent(c, i)
          )}
        </p>
        <p className="leading-5 text-gray-800 line-clamp-2">
          {_.map(_.slice(content, 2), (c: YarnContent, i) =>
            renderContent(c, i)
          )}
        </p>
      </>
    );
  }

  if (conIsReply || conIsComment) {
    return (
      <>
        <p className="mb-2 leading-5 text-gray-400 line-clamp-2">
          {_.map(_.slice(content, 0, 4), (c: YarnContent, i) =>
            renderContent(c, i)
          )}
        </p>
        <p className="leading-5 text-gray-800 line-clamp-2">
          {_.map(_.slice(content, 6), (c: YarnContent, i) =>
            renderContent(c, i)
          )}
        </p>
      </>
    );
  }

  return (
    <p className="leading-5 text-gray-800 line-clamp-2">
      {_.map(content, (c: YarnContent, i) => renderContent(c, i))}
    </p>
  );
}

function mentionPath(bin: Skein): string {
  const { wer } = bin.top;
  const parts = wer.split('/');
  const index = parts.indexOf('op');
  const ship = parts[index + 1];
  const id = parts[index + 2];

  if (index < 0 || !ship || !id) {
    return wer;
  }

  const time = useChatState.getState().getTime(ship, `${ship}/${id}`);
  return `${parts.slice(0, index).join('/')}?msg=${time}`;
}

export default function Notification({
  bin,
  avatar,
  topLine,
}: NotificationProps) {
  const { rope } = bin.top;
  const moreCount = bin.count - 1;
  const { mutate: sawRopeMutation } = useSawRopeMutation();
  const mentionBool = isMention(bin.top);
  const commentBool = isComment(bin.top);
  const replyBool = isReply(bin.top);
  const path = mentionBool ? mentionPath(bin) : bin.top.wer;
  const onClick = useCallback(() => {
    sawRopeMutation({ rope });
  }, [rope, sawRopeMutation]);

  return (
    <div
      className={cn(
        'relative flex space-x-3 rounded-xl p-3 text-gray-600',
        bin.unread ? 'bg-blue-soft dark:bg-blue-900' : 'bg-gray-50'
      )}
    >
      <Link
        to={path}
        className="flex w-full min-w-0 flex-1 space-x-3"
        onClick={onClick}
      >
        <div className="relative flex-none self-start">{avatar}</div>
        <div className="min-w-0 grow-0 break-words p-1">
          {topLine}
          <div className="my-2 leading-5">
            {bin.top && (
              <NotificationContent
                time={bin.time}
                content={bin.top.con}
                conIsMention={mentionBool}
                conIsComment={commentBool}
                conIsReply={replyBool}
              />
            )}
          </div>
          {moreCount > 0 ? (
            <p className="mt-2 text-sm font-semibold">
              Latest of {moreCount} new messages
            </p>
          ) : null}
          {mentionBool || commentBool || replyBool ? (
            <p
              className={cn(
                'small-button bg-blue-soft text-blue',
                moreCount > 0 ? 'mt-2' : 'mt-0'
              )}
            >
              Reply
            </p>
          ) : null}
        </div>
      </Link>
      <div className="absolute right-5 flex-none p-1">
        {bin.unread ? (
          <Dropdown.Root>
            <Dropdown.Trigger className="flex items-center space-x-1 text-sm">
              {bin.unread ? (
                <Bullet16Icon className="h-4 w-4 text-blue" />
              ) : null}
              <span className="font-semibold">
                {makePrettyTime(new Date(bin.time))}
              </span>
              <CaretDown16Icon className="h-4 w-4 text-gray-400" />
            </Dropdown.Trigger>
            <Dropdown.Content className="dropdown">
              <Dropdown.Item className="dropdown-item" onSelect={onClick}>
                Mark Read
              </Dropdown.Item>
            </Dropdown.Content>
          </Dropdown.Root>
        ) : (
          <span className="text-sm font-semibold">
            {makePrettyTime(new Date(bin.time))}
          </span>
        )}
      </div>
    </div>
  );
}
