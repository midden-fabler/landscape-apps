import React, { useState, useCallback, PropsWithChildren } from 'react';
import { useNavigate } from 'react-router';
import cn from 'classnames';
import EllipsisIcon from '@/components/icons/EllipsisIcon';
import DeleteChannelModal from '@/groups/ChannelsList/DeleteChannelModal';
import EditChannelModal from '@/groups/ChannelsList/EditChannelModal';
import { Status } from '@/logic/status';
import { useIsMobile } from '@/logic/useMedia';
import { nestToFlag, getFlagParts } from '@/logic/utils';
import { useRouteGroup, useDeleteChannelMutation } from '@/state/groups';
import { GroupChannel, Saga } from '@/types/groups';
import { useIsChannelHost } from '@/logic/channel';
import ActionMenu, { Action } from '@/components/ActionMenu';
import { ConnectionStatus } from '@/state/vitals';
import HostConnection from './HostConnection';

export type ChannelActionsProps = PropsWithChildren<{
  nest: string;
  prettyAppName: string;
  channel: GroupChannel | undefined;
  isAdmin: boolean | undefined;
  status?: ConnectionStatus;
  saga: Saga | null;
  leave: (flag: string) => Promise<void>;
  className?: string;
}>;

const ChannelActions = React.memo(
  ({
    nest,
    prettyAppName,
    channel,
    saga,
    status,
    isAdmin,
    leave,
    className,
    children,
  }: ChannelActionsProps) => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [_app, flag] = nestToFlag(nest);
    const groupFlag = useRouteGroup();
    const { ship, name } = getFlagParts(groupFlag);
    const [isOpen, setIsOpen] = useState(false);
    const [editIsOpen, setEditIsOpen] = useState(false);
    const [deleteChannelIsOpen, setDeleteChannelIsOpen] = useState(false);
    const [deleteStatus, setDeleteStatus] = useState<Status>('initial');
    const isChannelHost = useIsChannelHost(flag);
    const { mutate: deleteChannelMutate } = useDeleteChannelMutation();
    const hasChildren = !!children;

    const leaveChannel = useCallback(async () => {
      try {
        leave(flag);
        navigate(
          isMobile
            ? `/groups/${ship}/${name}`
            : `/groups/${ship}/${name}/channels`
        );
      } catch (error) {
        if (error) {
          // eslint-disable-next-line no-console
          console.error(`[ChannelHeader:LeaveError] ${error}`);
        }
      }
    }, [flag, ship, name, navigate, leave, isMobile]);

    const onDeleteChannelConfirm = useCallback(async () => {
      setDeleteStatus('loading');
      try {
        deleteChannelMutate({ flag: groupFlag, nest });
        navigate(
          isMobile
            ? `/groups/${ship}/${name}`
            : `/groups/${ship}/${name}/channels`
        );
        setDeleteStatus('success');
        setDeleteChannelIsOpen(!deleteChannelIsOpen);
      } catch (error) {
        setDeleteStatus('error');
        // eslint-disable-next-line no-console
        console.error(error);
      }
    }, [
      deleteChannelIsOpen,
      groupFlag,
      nest,
      deleteChannelMutate,
      isMobile,
      name,
      navigate,
      ship,
    ]);

    const actions: Action[] = [];

    if (isMobile) {
      actions.push({
        key: 'connectivity',
        keepOpenOnClick: true,
        content: (
          <HostConnection
            ship={ship}
            saga={saga}
            status={status}
            type="combo"
            className="-ml-1 text-[17px] font-medium text-gray-800"
          />
        ),
      });
    }

    if (isAdmin) {
      actions.push(
        {
          key: 'edit',
          content: `Edit ${prettyAppName}`,
          onClick: () => setEditIsOpen(!editIsOpen),
        },
        {
          key: 'delete',
          content: `Delete ${prettyAppName}`,
          onClick: () => setDeleteChannelIsOpen(!deleteChannelIsOpen),
          type: 'destructive',
        }
      );
    }

    if (!isChannelHost) {
      actions.push({
        key: 'leave',
        content: `Leave ${prettyAppName}`,
        onClick: leaveChannel,
        type: 'destructive',
      });
    }

    return (
      <>
        <ActionMenu
          className="max-w-full"
          open={isOpen}
          onOpenChange={setIsOpen}
          actions={actions}
        >
          <button
            className={cn(
              !hasChildren &&
                'default-focus flex h-8 w-8 items-center justify-center rounded text-gray-900 hover:bg-gray-50 sm:h-6 sm:w-6 sm:text-gray-600',
              className
            )}
            aria-label="Channel Options"
          >
            {hasChildren ? (
              children
            ) : (
              <EllipsisIcon className="h-8 w-8 p-1 sm:h-6 sm:w-6 sm:p-0" />
            )}
          </button>
        </ActionMenu>
        {channel && (
          <>
            <EditChannelModal
              editIsOpen={editIsOpen}
              setEditIsOpen={setEditIsOpen}
              nest={nest}
              channel={channel}
              setDeleteChannelIsOpen={setDeleteChannelIsOpen}
              app={_app}
            />
            <DeleteChannelModal
              deleteChannelIsOpen={deleteChannelIsOpen}
              onDeleteChannelConfirm={onDeleteChannelConfirm}
              setDeleteChannelIsOpen={setDeleteChannelIsOpen}
              channel={channel}
              deleteStatus={deleteStatus}
            />
          </>
        )}
      </>
    );
  }
);

export default ChannelActions;
