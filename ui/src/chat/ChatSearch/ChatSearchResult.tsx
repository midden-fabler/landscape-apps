import cn from 'classnames';
import { BigInteger } from 'big-integer';
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { daToUnix } from '@urbit/api';
import { Post, Reply } from '@/types/channel';
import { Writ } from '@/types/dms';
import ReplyReactions from '@/replies/ReplyReactions/ReplyReactions';
import Author from '../ChatMessage/Author';
import ChatContent from '../ChatContent/ChatContent';
import ChatReactions from '../ChatReactions/ChatReactions';

export interface ChatSearchResultProps {
  whom: string;
  root: string;
  time: BigInteger;
  writ: Post | Writ | Reply;
  index: number;
  selected: boolean;
  isScrolling?: boolean;
}

function ChatSearchResult({
  whom,
  root,
  time,
  writ,
  index,
  selected,
  isScrolling,
}: ChatSearchResultProps) {
  const unix = useMemo(() => new Date(daToUnix(time)), [time]);
  const postId = useMemo(() => {
    if ('parent-id' in writ.seal) {
      return writ.seal['parent-id'];
    }
    if ('time' in writ.seal) {
      return time;
    }

    return writ.seal.id;
  }, [writ, time]);
  const isReply = 'parent-id' in writ.seal;
  const replyScrollTo =
    isReply && 'time' in writ.seal ? `?thread-msg=${writ.seal.time}` : '';
  const scrollTo = `?msg=${postId}`;
  const to = isReply
    ? `${root}/message/${postId}${replyScrollTo}`
    : `${root}${scrollTo}`;
  const content = useMemo(() => {
    if ('essay' in writ) {
      return writ.essay.content;
    }
    if ('memo' in writ) {
      return writ.memo.content;
    }

    return [];
  }, [writ]);

  const author = useMemo(() => {
    if ('essay' in writ) {
      return writ.essay.author;
    }
    if ('memo' in writ) {
      return writ.memo.author;
    }

    return '';
  }, [writ]);
  const { reacts } = writ.seal;

  return (
    <Link
      to={to}
      id={`search-result-${time.toString()}`}
      className={cn(
        'default-focus flex flex-col break-words rounded-md border border-gray-50 px-2 py-1 hover:bg-gray-50',
        selected ? 'bg-gray-50' : ''
      )}
      role="option"
      aria-posinset={index + 1}
      aria-selected={selected}
    >
      <Author ship={author} date={unix} />
      <div className="group-one wrap-anywhere relative z-0 flex w-full flex-col space-y-2 py-1 pl-9">
        <ChatContent story={content} isScrolling={isScrolling} />
        {reacts &&
          Object.keys(reacts).length > 0 &&
          ('parent-id' in writ.seal ? (
            <ReplyReactions
              time={time.toString()}
              whom={whom}
              seal={writ.seal}
            />
          ) : (
            <ChatReactions seal={writ.seal} whom={whom} />
          ))}
      </div>
    </Link>
  );
}

export default React.memo(ChatSearchResult);
