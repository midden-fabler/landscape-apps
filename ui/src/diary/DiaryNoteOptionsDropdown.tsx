import React, { PropsWithChildren, useState } from 'react';
import classNames from 'classnames';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { Link } from 'react-router-dom';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useArrangedNotes } from '@/state/diary';
import { useChannel } from '@/logic/channel';
import { getFlagParts } from '@/logic/utils';
import useDiaryActions from './useDiaryActions';

type DiaryNoteOptionsDropdownProps = PropsWithChildren<{
  time: string;
  flag: string;
  canEdit: boolean;
  triggerClassName?: string;
}>;

export default function DiaryNoteOptionsDropdown({
  children,
  flag,
  time,
  triggerClassName,
  canEdit,
}: DiaryNoteOptionsDropdownProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const arrangedNotes = useArrangedNotes(flag);
  const { ship } = getFlagParts(flag);
  const chan = useChannel(flag);
  const saga = chan?.saga || null;
  const {
    isOpen,
    didCopy,
    onCopy,
    delNote,
    setIsOpen,
    addToArrangedNotes,
    removeFromArrangedNotes,
    moveUpInArrangedNotes,
    moveDownInArrangedNotes,
  } = useDiaryActions({
    flag,
    time,
  });

  return (
    <>
      <Dropdown.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dropdown.Trigger
          className={classNames('h-8 w-8 p-0', triggerClassName)}
          aria-label="Note menu"
        >
          {children}
        </Dropdown.Trigger>
        <Dropdown.Content sideOffset={8} className="dropdown min-w-[208px]">
          <Dropdown.Item className="dropdown-item" onSelect={onCopy}>
            {didCopy ? 'Link Copied!' : 'Copy Note Link'}
          </Dropdown.Item>

          {(canEdit && ship === window.our) ||
          (canEdit && saga && 'synced' in saga) ? (
            <>
              {arrangedNotes?.includes(time) ? (
                <>
                  <Dropdown.Item
                    className="dropdown-item"
                    onSelect={() => moveUpInArrangedNotes()}
                  >
                    Move Up
                  </Dropdown.Item>
                  <Dropdown.Item
                    className="dropdown-item"
                    onSelect={() => moveDownInArrangedNotes()}
                  >
                    Move Down
                  </Dropdown.Item>
                  <Dropdown.Item
                    className="dropdown-item"
                    onSelect={() => removeFromArrangedNotes()}
                  >
                    Remove from Pinned Notes
                  </Dropdown.Item>
                </>
              ) : (
                <Dropdown.Item
                  className="dropdown-item"
                  onSelect={() => addToArrangedNotes()}
                >
                  Add to Pinned Notes
                </Dropdown.Item>
              )}
              <Dropdown.Item className="dropdown-item" asChild>
                <Link to={`edit/${time}`}>Edit Note</Link>
              </Dropdown.Item>
              <Dropdown.Item
                className="dropdown-item text-red"
                onSelect={() => setDeleteOpen(true)}
              >
                Delete Note
              </Dropdown.Item>
            </>
          ) : null}
        </Dropdown.Content>
      </Dropdown.Root>
      <ConfirmationModal
        title="Delete Note"
        message="Are you sure you want to delete this note?"
        onConfirm={delNote}
        open={deleteOpen}
        setOpen={setDeleteOpen}
        confirmText="Delete"
      />
    </>
  );
}
