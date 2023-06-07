import cn from 'classnames';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import React, { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Link } from 'react-router-dom';
import Dialog from '@/components/Dialog';
import EllipsisIcon from '@/components/icons/EllipsisIcon';
import { useChatState, usePinned } from '@/state/chat';
import BulletIcon from '@/components/icons/BulletIcon';
import { whomIsMultiDm } from '@/logic/utils';
import useIsChannelUnread from '@/logic/useIsChannelUnread';
import DmInviteDialog from './DmInviteDialog';

interface DMOptionsProps {
  whom: string;
  pending: boolean;
  className?: string;
  isMulti?: boolean;
  alwaysShowEllipsis?: boolean;
}

export default function DmOptions({
  whom,
  pending,
  isMulti = false,
  alwaysShowEllipsis = false,
  className,
}: DMOptionsProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const pinned = usePinned();
  const isUnread = useIsChannelUnread(`chat/${whom}`);
  const hasActivity = isUnread || pending;
  const [isOpen, setIsOpen] = useState(false);
  const [inviteIsOpen, setInviteIsOpen] = useState(false);
  const onArchive = () => {
    navigate('/');
    useChatState.getState().archiveDm(whom);
  };

  const markRead = useCallback(async () => {
    await useChatState.getState().markRead(whom);
  }, [whom]);

  const [dialog, setDialog] = useState(false);

  const leaveMessage = async () => {
    navigate('/');
    if (whomIsMultiDm(whom)) {
      await useChatState.getState().multiDmRsvp(whom, false);
    } else {
      await useChatState.getState().dmRsvp(whom, false);
    }
  };
  const closeDialog = () => {
    setDialog(false);
  };

  const handlePin = useCallback(
    async (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.stopPropagation();
      const isPinned = pinned.includes(whom);
      await useChatState.getState().togglePin(whom, !isPinned);
    },
    [whom, pinned]
  );

  const handleInvite = () => {
    setInviteIsOpen(true);
  };

  const handleAccept = () => {
    useChatState.getState().dmRsvp(whom, true);
  };
  const handleDecline = async () => {
    navigate(-1);
    await useChatState.getState().dmRsvp(whom, false);
  };

  const handleMultiAccept = async () => {
    await useChatState.getState().multiDmRsvp(whom, true);
  };

  const handleMultiDecline = async () => {
    await useChatState.getState().multiDmRsvp(whom, false);
  };

  return (
    <>
      <DropdownMenu.Root onOpenChange={(open) => setIsOpen(open)} open={isOpen}>
        <DropdownMenu.Trigger asChild className="appearance-none">
          <div className={cn('relative h-6 w-6', className)}>
            {!alwaysShowEllipsis && !isOpen && hasActivity ? (
              <BulletIcon
                className="absolute h-6 w-6 text-blue transition-opacity group-focus-within:opacity-0 group-hover:opacity-0"
                aria-label="Has Activity"
              />
            ) : null}
            <button
              className={cn(
                'default-focus absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg p-0.5 transition-opacity focus-within:opacity-100 hover:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100',
                hasActivity && 'text-blue',
                isOpen || alwaysShowEllipsis ? 'opacity:100' : 'opacity-0'
              )}
              aria-label="Open Message Options"
            >
              <EllipsisIcon className="h-6 w-6 text-inherit" />
            </button>
          </div>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content className="dropdown">
          {pending ? (
            <>
              <DropdownMenu.Item
                className="dropdown-item"
                onClick={isMulti ? handleMultiAccept : handleAccept}
              >
                Accept
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="dropdown-item"
                onClick={isMulti ? handleMultiDecline : handleDecline}
              >
                Decline
              </DropdownMenu.Item>
            </>
          ) : (
            <>
              {hasActivity ? (
                <DropdownMenu.Item
                  className="dropdown-item-blue"
                  onClick={markRead}
                >
                  Mark Read
                </DropdownMenu.Item>
              ) : null}
              {isMulti ? (
                <DropdownMenu.Item className="dropdown-item" asChild>
                  <Link
                    to={`/dm/${whom}/edit-info`}
                    state={{ backgroundLocation: location }}
                  >
                    Chat Info
                  </Link>
                </DropdownMenu.Item>
              ) : null}
              <DropdownMenu.Item className="dropdown-item " onClick={handlePin}>
                {pinned.includes(whom) ? 'Unpin' : 'Pin'}
              </DropdownMenu.Item>
              {isMulti ? (
                <DropdownMenu.Item
                  className="dropdown-item "
                  onClick={handleInvite}
                >
                  Invite
                </DropdownMenu.Item>
              ) : null}
              <DropdownMenu.Item
                onSelect={leaveMessage}
                className="dropdown-item-red"
              >
                Leave Message
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      <Dialog open={dialog} onOpenChange={setDialog} containerClass="max-w-md">
        <div className="flex flex-col">
          <h2 className="mb-4 text-lg font-bold">Leave Chat</h2>
          <p className="mb-7 leading-5">
            Are you sure you want to leave this chat? Leaving will move this
            chat into your <strong>Archive</strong>. If you rejoin this channel,
            you’ll download everything you’ve missed since leaving it.
          </p>
          <div className="flex items-center justify-end space-x-2">
            <button onClick={closeDialog} className="button" type="button">
              Cancel
            </button>

            <button
              onClick={onArchive}
              className="button bg-red text-white"
              type="button"
            >
              Leave Chat
            </button>
          </div>
        </div>
      </Dialog>
      {isMulti ? (
        <DmInviteDialog
          inviteIsOpen={inviteIsOpen}
          setInviteIsOpen={setInviteIsOpen}
          whom={whom}
        />
      ) : null}
    </>
  );
}
