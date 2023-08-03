import cn from 'classnames';
import React, { useCallback, useEffect } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import useEmoji from '@/state/emoji';
import X16Icon from '@/components/icons/X16Icon';
import ShipName from '@/components/ShipName';
import {
  useAddQuipFeelMutation,
  useDeleteQuipFeelMutation,
} from '@/state/diary';

interface QuipReactionProps {
  whom: string;
  feel: string;
  ships: string[];
  time: string;
  noteId: string;
}

export default function QuipReaction({
  whom,
  feel,
  ships,
  time,
  noteId,
}: QuipReactionProps) {
  const { load } = useEmoji();
  const isMine = ships.includes(window.our);
  const count = ships.length;
  const { mutateAsync: addQuipFeel } = useAddQuipFeelMutation();
  const { mutateAsync: delQuipFeel } = useDeleteQuipFeelMutation();

  useEffect(() => {
    load();
  }, [load]);

  const editFeel = useCallback(async () => {
    if (isMine) {
      await delQuipFeel({ flag: whom, noteId, quipId: time });
    } else {
      await addQuipFeel({ flag: whom, noteId, quipId: time, feel });
    }
  }, [isMine, whom, feel, noteId, time, addQuipFeel, delQuipFeel]);

  return (
    <div>
      {count > 0 && (
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              onClick={editFeel}
              className={cn(
                'group relative flex items-center space-x-2 rounded border border-solid border-transparent bg-gray-50 px-2 py-1 text-sm font-semibold leading-4 text-gray-600 group-one-hover:border-gray-100',
                isMine && 'bg-blue-softer group-one-hover:border-blue-soft'
              )}
              aria-label={
                isMine ? 'Remove reaction' : `Add ${feel.replaceAll(':', '')}`
              }
            >
              <em-emoji shortcodes={feel} />
              <span className={cn(isMine && 'group-hover:opacity-0')}>
                {count}
              </span>
              <X16Icon
                className={cn(
                  'absolute right-1 hidden h-3 w-3',
                  isMine && 'group-hover:inline'
                )}
              />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content asChild>
              <div className="pointer-events-none z-20 justify-items-center rounded">
                <div className="z-[100] w-fit cursor-none rounded bg-gray-400 px-4 py-2">
                  <label className="whitespace-nowrap font-semibold text-white">
                    {ships.map((ship, i) => (
                      <div key={ship}>
                        <ShipName name={ship} showAlias />
                        {i + 1 === ships.length ? '' : ', '}
                      </div>
                    ))}
                  </label>
                </div>
                <Tooltip.Arrow asChild>
                  <svg
                    width="17"
                    height="8"
                    viewBox="0 0 17 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16.5 0L0.5 0L7.08579 6.58579C7.86684 7.36684 9.13316 7.36684 9.91421 6.58579L16.5 0Z"
                      className="fill-gray-400"
                    />
                  </svg>
                </Tooltip.Arrow>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      )}
    </div>
  );
}
