import cn from 'classnames';
import React, {
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import EllipsisIcon from '@/components/icons/EllipsisIcon';
import useIsGroupUnread, {
  useGroupUnreadCounts,
} from '@/logic/useIsGroupUnread';
import UnreadIndicator from '@/components/Sidebar/UnreadIndicator';
import {
  citeToPath,
  getFlagParts,
  getPrivacyFromGroup,
  useCopy,
} from '@/logic/utils';
import {
  useAmAdmin,
  useGang,
  useGroup,
  useGroupCancelMutation,
} from '@/state/groups';
import ActionMenu, { Action } from '@/components/ActionMenu';
import { Saga } from '@/types/groups';
import { ConnectionStatus } from '@/state/vitals';
import HostConnection from '@/channels/HostConnection';
import { useIsMobile } from '@/logic/useMedia';
import VolumeSetting from '@/components/VolumeSetting';
import {
  useAddPinMutation,
  useDeletePinMutation,
  usePinnedGroups,
} from '@/state/pins';

const { ship } = window;

export function useGroupActions({
  flag,
  open = false,
  onOpenChange,
}: {
  flag: string;
  open?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}) {
  const { mutateAsync: addPin } = useAddPinMutation();
  const { mutateAsync: deletePin } = useDeletePinMutation();
  const [isOpen, setIsOpen] = useState(false);
  const handleOpenChange = useCallback(
    (innerOpen: boolean) => {
      if (onOpenChange) {
        onOpenChange(innerOpen);
      } else {
        setIsOpen(innerOpen);
      }
    },
    [onOpenChange]
  );

  useEffect(() => {
    setIsOpen(open);
  }, [open, setIsOpen]);

  const { doCopy } = useCopy(citeToPath({ group: flag }));
  const [copyItemText, setCopyItemText] = useState('Copy Group Link');
  const pinned = usePinnedGroups();
  const isPinned = Object.keys(pinned).includes(flag);

  const onCopy = useCallback(() => {
    doCopy();
    setCopyItemText('Copied!');
    setTimeout(() => {
      setCopyItemText('Copy Group Link');
      handleOpenChange(false);
    }, 2000);
  }, [doCopy, handleOpenChange]);

  const onPinClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isPinned) {
        deletePin({ pin: flag });
      } else {
        addPin({ pin: flag });
      }
    },
    [flag, isPinned, addPin, deletePin]
  );

  return {
    isOpen,
    isPinned,
    setIsOpen: handleOpenChange,
    copyItemText,
    onCopy,
    onPinClick,
  };
}

type GroupActionsProps = PropsWithChildren<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  flag: string;
  saga?: Saga | null;
  status?: ConnectionStatus;
  triggerDisabled?: boolean;
  className?: string;
}>;

const GroupActions = React.memo(
  ({
    open,
    onOpenChange,
    flag,
    saga,
    status,
    triggerDisabled,
    className,
    children,
  }: GroupActionsProps) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const { isGroupUnread } = useIsGroupUnread();
    const unreadCounts = useGroupUnreadCounts();
    const unreads = unreadCounts[flag];
    const { claim } = useGang(flag);
    const location = useLocation();
    const navigate = useNavigate();
    const hasActivity = isGroupUnread(flag);
    const group = useGroup(flag);
    const privacy = group ? getPrivacyFromGroup(group) : undefined;
    const isAdmin = useAmAdmin(flag);
    const isMobile = useIsMobile();
    const { mutate: cancelJoinMutation } = useGroupCancelMutation();
    const { isOpen, setIsOpen, isPinned, copyItemText, onCopy, onPinClick } =
      useGroupActions({ flag, open, onOpenChange });

    const onCopySelect = useCallback(
      (event: React.MouseEvent) => {
        event.preventDefault();
        onCopy();
      },
      [onCopy]
    );

    const actions: Action[] = [];
    const notificationActions: Action[] = [];

    if (saga && isMobile) {
      actions.push({
        key: 'connectivity',
        keepOpenOnClick: true,
        content: (
          <HostConnection
            ship={getFlagParts(flag).ship}
            status={status}
            saga={saga}
            type="combo"
            className="-ml-1 text-[17px] font-medium text-gray-800"
          />
        ),
      });
    }

    if (privacy === 'public' || isAdmin) {
      actions.push({
        key: 'invite',
        type: 'prominent',
        content: (
          <Link
            to={`/groups/${flag}/invite`}
            state={{ backgroundLocation: location }}
          >
            Invite People
          </Link>
        ),
      });
    }

    notificationActions.push({
      key: 'volume',
      content: (
        <div className="-mx-2 flex flex-col space-y-6">
          <div className="flex flex-col space-y-1">
            <span className="text-lg text-gray-800">Notification Settings</span>
            <span className="font-normal font-[17px] text-gray-400">
              {group?.meta.title || `~${flag}`}
            </span>
          </div>
          <VolumeSetting scope={{ group: flag }} />
        </div>
      ),
      keepOpenOnClick: true,
    });

    actions.push(
      {
        key: 'notifications',
        onClick: () => {
          if (isMobile) {
            setShowNotifications(true);
          } else {
            navigate(`/groups/${flag}/volume`, {
              state: { backgroundLocation: location },
            });
          }
        },
        content: 'Notifications',
      },
      {
        key: 'copy',
        onClick: onCopySelect,
        content: copyItemText,
        keepOpenOnClick: true,
      },
      {
        key: 'pin',
        onClick: onPinClick,
        content: isPinned ? 'Unpin' : 'Pin',
      },
      {
        key: 'settings',
        onClick: () => setIsOpen(false),
        content: isAdmin ? (
          <Link
            to={`/groups/${flag}/edit`}
            state={{ backgroundLocation: location }}
          >
            Group Settings
          </Link>
        ) : (
          <Link
            to={`/groups/${flag}/info`}
            state={{ backgroundLocation: location }}
          >
            Group Members & Info
          </Link>
        ),
      }
    );

    if (!flag.includes(ship)) {
      actions.push({
        key: 'leave',
        type: 'destructive',
        content: (
          <Link
            to={`/groups/${flag}/leave`}
            state={{ backgroundLocation: location }}
          >
            Leave Group
          </Link>
        ),
      });
    }

    if (claim) {
      actions.push({
        key: 'cancel_join',
        type: 'destructive',
        onClick: () => {
          cancelJoinMutation({ flag });
          setIsOpen(false);
        },
        content: 'Cancel Join',
      });
    }

    return (
      <>
        <ActionMenu
          open={isOpen}
          onOpenChange={setIsOpen}
          actions={actions}
          disabled={triggerDisabled}
          asChild={!triggerDisabled}
          className={className}
        >
          {children || (
            <div className="relative h-6 w-6">
              {isMobile && !isOpen && hasActivity && (
                <UnreadIndicator
                  className="absolute top-[3px] !font-normal"
                  aria-label={`${unreads} unread messages`}
                  count={unreads}
                />
              )}
              {!isMobile && !isOpen && hasActivity && (
                <UnreadIndicator
                  className="absolute h-6 w-6 bg-transparent !p-0 text-blue transition-opacity group-focus-within:opacity-0 sm:group-hover:opacity-0"
                  aria-label="Has Activity"
                />
              )}
              {!isMobile && (
                <button
                  className={cn(
                    'default-focus absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg p-0.5 transition-opacity focus-within:opacity-100 group-focus-within:opacity-100 sm:hover:opacity-100 sm:group-hover:opacity-100',
                    hasActivity && 'text-blue',
                    isOpen ? 'opacity:100' : 'opacity-0'
                  )}
                  aria-label="Open Group Options"
                >
                  <EllipsisIcon className="h-6 w-6" />
                </button>
              )}
            </div>
          )}
        </ActionMenu>
        <ActionMenu
          open={showNotifications}
          onOpenChange={setShowNotifications}
          actions={notificationActions}
        />
      </>
    );
  }
);

export default GroupActions;
