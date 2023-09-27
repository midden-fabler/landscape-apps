import { debounce } from 'lodash';
import React, {
  ChangeEvent,
  MouseEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import fuzzy from 'fuzzy';
import { Virtuoso } from 'react-virtuoso';
import { deSig } from '@urbit/api';
import { useLocation, useNavigate } from 'react-router';
import ActionMenu, { Action } from '@/components/ActionMenu';
import Avatar from '@/components/Avatar';
import ConfirmationModal from '@/components/ConfirmationModal';
import Divider from '@/components/Divider';
import MagnifyingGlassMobileNavIcon from '@/components/icons/MagnifyingGlassMobileNavIcon';
import MobileHeader from '@/components/MobileHeader';
import ShipName from '@/components/ShipName';
import SidebarItem from '@/components/Sidebar/SidebarItem';
import { isNativeApp } from '@/logic/native';
import { useModalNavigate } from '@/logic/routing';
import useNavigateByApp from '@/logic/useNavigateByApp';
import { getSectTitle } from '@/logic/utils';
import { useContact } from '@/state/contact';
import {
  useRouteGroup,
  useGroup,
  useGroupBanShipsMutation,
  useGroupDelMembersMutation,
  useGroupFlag,
  useAmAdmin,
  useVessel,
  useSects,
  useGroupSectMutation,
  useGroupCompatibility,
} from '@/state/groups';
import XIcon from '@/components/icons/XIcon';
import { Vessel } from '@/types/groups';
import CheckIcon from '@/components/icons/CheckIcon';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import ExclamationPoint from '@/components/icons/ExclamationPoint';
import RoleBadges from '@/components/RoleBadges';

interface GroupMemberItemProps {
  member: string;
}

function Role({ role, member }: { role: string; member: string }) {
  const flag = useGroupFlag();
  const group = useGroup(flag);
  const vessel = useVessel(flag, member);
  const [sectLoading, setSectLoading] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const { mutateAsync: sectMutation } = useGroupSectMutation();

  const toggleSect = useCallback(
    (ship: string, sect: string, v: Vessel) => async (event: MouseEvent) => {
      event.preventDefault();

      const inSect = v.sects.includes(sect);

      if (inSect && sect === 'admin' && flag.includes(ship)) {
        setIsOwner(true);
        return;
      }
      if (inSect) {
        try {
          setSectLoading(sect);
          await sectMutation({ flag, ship, sects: [sect], operation: 'del' });
          setSectLoading('');
        } catch (e) {
          console.error(e);
        }
      } else {
        try {
          setSectLoading(sect);
          await sectMutation({ flag, ship, sects: [sect], operation: 'add' });
          setSectLoading('');
        } catch (e) {
          console.log(e);
        }
      }
    },
    [flag, sectMutation]
  );

  if (!group) {
    return null;
  }

  return (
    <button
      onClick={toggleSect(member, role, vessel)}
      className="flex items-center"
    >
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200">
        {sectLoading === role ? (
          <LoadingSpinner className="h-4 w-4" />
        ) : isOwner ? (
          <ExclamationPoint className="h-4 w-4 text-red" />
        ) : vessel.sects.includes(role) ? (
          <CheckIcon className="h-4 w-4" />
        ) : null}
      </div>
      <span className="ml-4">{getSectTitle(group.cabals, role)}</span>
    </button>
  );
}

const Member = React.memo(({ member }: GroupMemberItemProps) => {
  const navigate = useNavigate();
  const flag = useGroupFlag();
  const group = useGroup(flag);
  const sects = useSects(flag);
  const { compatible } = useGroupCompatibility(flag);
  const isAdmin = useAmAdmin(flag);
  const [isOpen, setIsOpen] = useState(false);
  const [rolesIsOpen, setRolesIsOpen] = useState(false);
  const [showKickConfirm, setShowKickConfirm] = useState(false);
  const [loadingKick, setLoadingKick] = useState(false);
  const [loadingBan, setLoadingBan] = useState(false);
  const [showBanConfirm, setShowBanConfirm] = useState(false);
  const contact = useContact(member);
  const location = useLocation();
  const navigateByApp = useNavigateByApp();
  const { mutate: delMembersMutation } = useGroupDelMembersMutation();
  const { mutate: banShipsMutation } = useGroupBanShipsMutation();

  const onViewProfile = (ship: string) => {
    navigate(`/profile/${ship}`, {
      state: { backgroundLocation: location },
    });
  };

  const onSendMessage = (ship: string) => {
    if (isNativeApp()) {
      navigate(`/dm/${ship}`);
    } else {
      navigateByApp(`/dm/${ship}`);
    }
  };

  const kick = useCallback(
    (ship: string) => async () => {
      setLoadingKick(true);
      delMembersMutation({ flag, ships: [ship] });
      setLoadingKick(false);
    },
    [flag, delMembersMutation]
  );

  const ban = useCallback(
    (ship: string) => async () => {
      setLoadingBan(true);
      banShipsMutation({ flag, ships: [ship] });
      setLoadingBan(false);
    },
    [flag, banShipsMutation]
  );

  const actions: Action[] = [
    {
      key: 'profile',
      content: 'View Profile',
      onClick: () => onViewProfile(member),
    },
    {
      key: 'message',
      content: 'Send Message',
      onClick: () => onSendMessage(member),
    },
  ];

  if (!group) {
    return null;
  }

  const roleActions: Action[] = sects.map((s) => ({
    key: s,
    content: <Role role={s} member={member} />,
    keepOpenOnClick: true,
  }));

  if (member !== window.our && isAdmin && compatible) {
    actions.push(
      {
        key: 'set-role',
        content: 'Set Role',
        onClick: () => {
          setIsOpen(false);
          setRolesIsOpen(true);
        },
      },
      {
        key: 'kick',
        content: 'Kick',
        type: 'destructive',
        onClick: () => setShowKickConfirm(true),
      },
      {
        key: 'ban',
        content: 'Ban',
        type: 'destructive',
        onClick: () => setShowBanConfirm(true),
      }
    );
  }

  return (
    <div key={member}>
      <ActionMenu
        className="w-full"
        open={isOpen}
        onOpenChange={setIsOpen}
        actions={actions}
      >
        <SidebarItem
          icon={<Avatar ship={member} size="default" icon={false} />}
          key={member}
        >
          <div className="flex h-full w-full flex-col items-start justify-center">
            {contact?.nickname ? (
              contact.nickname
            ) : (
              <ShipName name={member} full />
            )}
            <RoleBadges ship={member} inList />
          </div>
        </SidebarItem>
      </ActionMenu>
      <ActionMenu
        className="w-full"
        open={rolesIsOpen}
        onOpenChange={setRolesIsOpen}
        actions={roleActions}
      />
      <ConfirmationModal
        title="Kick Member"
        message={`Are you sure you want to kick ${member}?`}
        confirmText="Kick"
        loading={loadingKick}
        onConfirm={kick(member)}
        open={showKickConfirm}
        setOpen={setShowKickConfirm}
      />
      <ConfirmationModal
        title="Ban Member"
        message={`Are you sure you want to ban ${member}?`}
        confirmText="Ban"
        loading={loadingBan}
        onConfirm={ban(member)}
        open={showBanConfirm}
        setOpen={setShowBanConfirm}
      />
    </div>
  );
});

function MemberScroller({ members }: { members: string[] }) {
  const thresholds = {
    atBottomThreshold: 125,
    atTopThreshold: 125,
    overscan: { main: 200, reverse: 200 },
  };

  if (members.length === 0) {
    return <p>No members</p>;
  }

  return (
    <Virtuoso
      {...thresholds}
      data={members}
      computeItemKey={(i, member: string) => member}
      itemContent={(i, member: string) => (
        <Member key={member} member={member} />
      )}
      style={{
        minHeight: '100%',
      }}
    />
  );
}

export default function Members() {
  const [toggleSearch, setToggleSearch] = useState(false);
  const [search, setSearch] = useState('');
  const [rawInput, setRawInput] = useState('');
  const onUpdate = useRef(
    debounce((value: string) => {
      setSearch(value);
    }, 150)
  );
  const flag = useRouteGroup();
  const group = useGroup(flag, true);
  const members = useMemo(() => {
    if (!group) {
      return [];
    }
    return Object.keys(group.fleet).filter((k) => {
      if ('shut' in group.cordon) {
        return (
          !group.cordon.shut.ask.includes(k) &&
          !group.cordon.shut.pending.includes(k)
        );
      }
      if (group.fleet[k].sects.includes('admin')) {
        return false;
      }
      return true;
    });
  }, [group]);

  const admins = useMemo(() => {
    if (!group) {
      return [];
    }
    return Object.keys(group.fleet).filter((k) => {
      if (group.fleet[k].sects.includes('admin')) {
        return true;
      }
      return false;
    });
  }, [group]);

  const results = useMemo(
    () =>
      fuzzy
        .filter(search, members)
        .sort((a, b) => {
          const filter = deSig(search) || '';
          const left = deSig(a.string)?.startsWith(filter)
            ? a.score + 1
            : a.score;
          const right = deSig(b.string)?.startsWith(filter)
            ? b.score + 1
            : b.score;

          return right - left;
        })
        .map((result) => members[result.index]),
    [search, members]
  );

  const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setRawInput(value);
    onUpdate.current(value);
  }, []);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white">
      <MobileHeader
        title={
          !toggleSearch ? (
            'Members'
          ) : (
            <input
              autoFocus
              className="input"
              placeholder="Filter Members"
              value={rawInput}
              onChange={onChange}
            />
          )
        }
        goBack
        action={
          <div className="flex h-12 flex-row items-center justify-end space-x-2">
            <button onClick={() => setToggleSearch(!toggleSearch)}>
              {toggleSearch ? (
                <XIcon className="h-6 w-6 text-gray-800" />
              ) : (
                <MagnifyingGlassMobileNavIcon className="h-6 w-6 text-gray-800" />
              )}
            </button>
          </div>
        }
      />
      <div className="h-full overflow-auto px-4">
        <Divider isMobile={true}>Admin</Divider>
        {admins.map((admin) => (
          <Member key={admin} member={admin} />
        ))}
        <Divider isMobile={true}>Everyone else</Divider>
        {results.length === 0 ? (
          <p className="mt-4 text-center text-gray-400">
            No members match your search
          </p>
        ) : null}
        <MemberScroller members={results} />
      </div>
    </div>
  );
}
