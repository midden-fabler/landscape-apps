import cn from 'classnames';
import { Editor, JSONContent } from '@tiptap/react';
import React, { useCallback, useEffect } from 'react';
import { reduce } from 'lodash';
import { HeapInline, CurioHeart, HeapInlineKey } from '@/types/heap';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import MessageEditor, { useMessageEditor } from '@/components/MessageEditor';
import ChatInputMenu from '@/chat/ChatInputMenu/ChatInputMenu';
import { useIsMobile } from '@/logic/useMedia';
import { useHeapState } from '@/state/heap/heap';
import useRequestState from '@/logic/useRequestState';
import { JSONToInlines } from '@/logic/tiptap';
import {
  fetchChatBlocks,
  useChatInfo,
  useChatStore,
} from '@/chat/useChatStore';
import X16Icon from '@/components/icons/X16Icon';
import ArrowNIcon16 from '@/components/icons/ArrowNIcon16';
import useGroupPrivacy from '@/logic/useGroupPrivacy';
import { captureGroupsAnalyticsEvent } from '@/logic/analytics';
import Tooltip from '@/components/Tooltip';
import { useChannelCompatibility } from '@/logic/channel';

interface HeapTextInputProps {
  flag: string;
  groupFlag: string;
  draft: JSONContent | undefined;
  setDraft: React.Dispatch<React.SetStateAction<JSONContent | undefined>>;
  placeholder?: string;
  sendDisabled?: boolean;
  replyTo?: string | null;
  className?: string;
  inputClass?: string;
  comment?: boolean;
}

const MERGEABLE_KEYS = ['italics', 'bold', 'strike', 'blockquote'] as const;
function isMergeable(x: HeapInlineKey): x is (typeof MERGEABLE_KEYS)[number] {
  return MERGEABLE_KEYS.includes(x as any);
}
function normalizeHeapInline(inline: HeapInline[]): HeapInline[] {
  return reduce(
    inline,
    (acc: HeapInline[], val) => {
      if (acc.length === 0) {
        return [...acc, val];
      }
      const last = acc[acc.length - 1];
      if (typeof last === 'string' && typeof val === 'string') {
        return [...acc.slice(0, -1), last + val];
      }
      const lastKey = Object.keys(acc[acc.length - 1])[0] as HeapInlineKey;
      const currKey = Object.keys(val)[0] as keyof HeapInlineKey;
      if (isMergeable(lastKey) && currKey === lastKey) {
        // @ts-expect-error keying weirdness
        const end: HeapInline = {
          // @ts-expect-error keying weirdness
          [lastKey]: [...last[lastKey as any], ...val[currKey as any]],
        };
        return [...acc.slice(0, -1), end];
      }
      return [...acc, val];
    },
    []
  );
}

function SubmitLabel({ comment }: { comment?: boolean }) {
  if (comment) {
    return <ArrowNIcon16 className="h-4 w-4" />;
  }
  return <span>Post</span>;
}

export default function HeapTextInput({
  flag,
  groupFlag,
  draft,
  setDraft,
  replyTo = null,
  sendDisabled = false,
  placeholder,
  className,
  inputClass,
  comment = false,
}: HeapTextInputProps) {
  const isMobile = useIsMobile();
  const { isPending, setPending, setReady } = useRequestState();
  const chatInfo = useChatInfo(flag);
  const { privacy } = useGroupPrivacy(groupFlag);
  const { compatible, text } = useChannelCompatibility(`heap/${flag}`);

  /**
   * This handles submission for new Curios; for edits, see EditCurioForm
   */
  const onSubmit = useCallback(
    async (editor: Editor) => {
      if (sendDisabled) {
        return;
      }
      const blocks = fetchChatBlocks(flag);
      if (!editor.getText() && !blocks.length) {
        return;
      }

      setPending();

      const content = {
        inline:
          blocks.length === 0
            ? normalizeHeapInline(
                JSONToInlines(editor?.getJSON()) as HeapInline[]
              )
            : [],
        block: blocks,
      };

      const heart: CurioHeart = {
        title: '', // TODO: Title input
        replying: replyTo,
        author: window.our,
        sent: Date.now(),
        content,
      };

      setDraft(undefined);
      editor?.commands.setContent('');
      useChatStore.getState().setBlocks(flag, []);

      await useHeapState.getState().addCurio(flag, heart);
      captureGroupsAnalyticsEvent({
        name: comment ? 'comment_item' : 'post_item',
        groupFlag,
        chFlag: flag,
        channelType: 'heap',
        privacy,
      });
      setReady();
    },
    [
      sendDisabled,
      setPending,
      replyTo,
      flag,
      groupFlag,
      privacy,
      comment,
      setDraft,
      setReady,
    ]
  );

  const onUpdate = useCallback(
    ({ editor }: { editor: Editor }) => {
      setDraft(editor.getJSON());
    },
    [setDraft]
  );

  const messageEditor = useMessageEditor({
    whom: flag,
    content: draft || '',
    uploadKey: `heap-text-input-${flag}`,
    placeholder: placeholder || 'Enter Text Here',
    editorClass: '!max-h-[108px] overflow-y-auto',
    onUpdate,
    onEnter: useCallback(
      ({ editor }) => {
        onSubmit(editor);
        return true;
      },
      [onSubmit]
    ),
  });

  useEffect(() => {
    if (flag && messageEditor && !messageEditor.isDestroyed) {
      messageEditor?.commands.setContent('');
    }
  }, [flag, messageEditor]);

  useEffect(() => {
    if (draft && messageEditor && !messageEditor.isDestroyed) {
      messageEditor.commands.setContent(draft);
    }
    // only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageEditor]);

  const onClick = useCallback(
    () => messageEditor && onSubmit(messageEditor),
    [messageEditor, onSubmit]
  );

  if (!messageEditor) {
    return null;
  }

  // TODO: Set a sane length limit for comments
  return (
    <>
      <div
        className={cn('items-end', className)}
        onClick={() => messageEditor.commands.focus()}
      >
        {chatInfo.blocks.length > 0 ? (
          <div className="my-2 flex w-full items-center justify-start font-semibold">
            <span className="mr-2 text-gray-600">Attached: </span>
            {chatInfo.blocks.length} reference
            {chatInfo.blocks.length === 1 ? '' : 's'}
            <button
              className="icon-button ml-auto"
              onClick={() => useChatStore.getState().setBlocks(flag, [])}
            >
              <X16Icon className="h-4 w-4" />
            </button>
          </div>
        ) : null}
        <div
          className={cn(
            'w-full',
            comment ? 'flex flex-row items-end' : 'relative flex h-full'
          )}
        >
          <MessageEditor
            editor={messageEditor}
            className={cn('w-full rounded-lg', inputClass)}
            inputClassName={cn(
              // Since TipTap simulates an input using a <p> tag, only style
              // the fake placeholder when the field is empty
              messageEditor.getText() === '' ? 'text-gray-400' : ''
            )}
          />
          {!sendDisabled ? (
            <Tooltip content={text} open={compatible ? false : undefined}>
              <button
                className={cn(
                  'button rounded-md px-2 py-1',
                  comment ? 'ml-2 shrink-0' : 'absolute bottom-3 right-3'
                )}
                disabled={
                  isPending ||
                  !compatible ||
                  (messageEditor.getText() === '' &&
                    chatInfo.blocks.length === 0)
                }
                onClick={onClick}
              >
                {isPending ? (
                  <LoadingSpinner secondary="black" />
                ) : (
                  <SubmitLabel comment={comment} />
                )}
              </button>
            </Tooltip>
          ) : null}
        </div>
      </div>
      {isMobile && messageEditor.isFocused ? (
        <ChatInputMenu editor={messageEditor} />
      ) : null}
    </>
  );
}
