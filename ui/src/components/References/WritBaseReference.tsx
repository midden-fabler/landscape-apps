import React, { useMemo } from 'react';
import bigInt from 'big-integer';
import cn from 'classnames';
import { unixToDa } from '@urbit/api';
import { useLocation, useNavigate } from 'react-router-dom';
import { useChannelPreview, useGang } from '@/state/groups';
// eslint-disable-next-line import/no-cycle
import ChatContent from '@/chat/ChatContent/ChatContent';
import HeapLoadingBlock from '@/heap/HeapLoadingBlock';
import useGroupJoin from '@/groups/useGroupJoin';
import { useChannelFlag } from '@/logic/channel';
import { isImageUrl, nestToFlag } from '@/logic/utils';
import { ReferenceResponse } from '@/types/channel';
import ReferenceBar from './ReferenceBar';
import ShipName from '../ShipName';
import ReferenceInHeap from './ReferenceInHeap';
import BubbleIcon from '../icons/BubbleIcon';

interface WritBaseReferenceProps {
  nest: string;
  reference?: ReferenceResponse;
  isScrolling: boolean;
  contextApp?: string;
  children?: React.ReactNode;
}

function WritBaseReference({
  nest,
  reference,
  isScrolling,
  contextApp,
  children,
}: WritBaseReferenceProps) {
  const preview = useChannelPreview(nest, isScrolling);
  const location = useLocation();
  const navigate = useNavigate();
  const [app, chFlag] = nestToFlag(nest);
  const refMessageType = useMemo(() => {
    if (app === 'chat') {
      return 'message';
    }
    if (app === 'heap') {
      return 'curio';
    }
    return 'note';
  }, [app]);
  const isReply = useChannelFlag() === chFlag;
  const groupFlag = preview?.group?.flag || '~zod/test';
  const gang = useGang(groupFlag);
  const { group } = useGroupJoin(groupFlag, gang);
  const content = useMemo(() => {
    if (reference && 'note' in reference && 'essay' in reference.note) {
      return reference.note.essay.content;
    }
    if (reference && 'quip' in reference && 'memo' in reference.quip.quip) {
      return reference.quip.quip.memo.content;
    }
    return [];
  }, [reference]);
  const author = useMemo(() => {
    if (reference && 'note' in reference && 'essay' in reference.note) {
      return reference.note.essay.author;
    }
    if (reference && 'quip' in reference && 'memo' in reference.quip.quip) {
      return reference.quip.quip.memo.author;
    }
    return '';
  }, [reference]);
  const noteId = useMemo(() => {
    if (reference && 'note' in reference) {
      return reference.note.seal.id;
    }
    if (reference && 'quip' in reference) {
      return reference.quip['id-note'];
    }
    return '';
  }, [reference]);

  // TODO: handle failure for useWritByFlagAndWritId call.
  if (!reference) {
    return <HeapLoadingBlock reference />;
  }

  if (content.length === 0) {
    return null;
  }

  const handleOpenReferenceClick = () => {
    if (!group) {
      if ('note' in reference) {
        navigate(
          `/gangs/${groupFlag}?type=chat&nest=${nest}&id=${reference.note.seal.id}`,
          {
            state: { backgroundLocation: location },
          }
        );
      } else {
        navigate(
          `/gangs/${groupFlag}?type=chat&nest=${nest}&id=${reference.quip['id-note']}`,
          {
            state: { backgroundLocation: location },
          }
        );
      }
      return;
    }
    if ('note' in reference) {
      navigate(
        `/groups/${groupFlag}/channels/${nest}?msg=${reference.note.seal.id}`
      );
    } else {
      navigate(
        `/groups/${groupFlag}/channels/${nest}/${refMessageType}/${reference.quip['id-note']}`
      );
    }
  };

  if (contextApp === 'heap-row') {
    return (
      <ReferenceInHeap
        type="text"
        contextApp={contextApp}
        image={
          group && isImageUrl(group.meta.image) ? (
            <img
              src={group.meta.image}
              className="h-[72px] w-[72px] rounded object-cover"
            />
          ) : (
            <div
              className="h-[72px] w-[72px] rounded"
              style={{ background: group?.meta.image }}
            />
          )
        }
        title={
          content.filter((c) => 'block' in c).length > 0 ? (
            <span>Nested content references</span>
          ) : (
            <ChatContent
              className="line-clamp-1"
              story={content}
              isScrolling={false}
            />
          )
        }
        byline={
          <span>
            Chat message by <ShipName name={author} showAlias /> in{' '}
            {preview?.meta?.title}
          </span>
        }
      >
        {children}
      </ReferenceInHeap>
    );
  }

  if (contextApp === 'heap-comment') {
    return (
      <div
        onClick={handleOpenReferenceClick}
        className="cursor-pointer rounded-lg border-2 border-gray-50 text-base"
      >
        <ReferenceInHeap type="text" contextApp={contextApp}>
          <ChatContent
            className="p-2 line-clamp-1"
            story={content}
            isScrolling={false}
          />
          {children}
          <ReferenceBar
            nest={nest}
            time={bigInt(noteId)}
            author={author}
            groupFlag={preview?.group.flag}
            groupImage={group?.meta.image}
            groupTitle={preview?.group.meta.title}
            channelTitle={preview?.meta?.title}
            heapComment
          />
        </ReferenceInHeap>
      </div>
    );
  }

  return (
    <div
      className={cn('writ-inline-block not-prose group', {
        'mb-2': isReply,
      })}
    >
      <div
        onClick={handleOpenReferenceClick}
        className={'cursor-pointer p-2 group-hover:bg-gray-50'}
      >
        <ChatContent className="p-2" story={content} isScrolling={false} />
      </div>
      <ReferenceBar
        nest={nest}
        time={bigInt(noteId)}
        author={author}
        groupFlag={preview?.group.flag}
        groupImage={group?.meta.image}
        groupTitle={preview?.group.meta.title}
        channelTitle={preview?.meta?.title}
        reply={isReply}
      />
    </div>
  );
}

export default React.memo(WritBaseReference);
