import classNames from 'classnames';
import React from 'react';
import { useLocation } from 'react-router';
import { Link } from 'react-router-dom';
import { ModalLocationState } from '../logic/routing';
import { useIsMobile } from '../logic/useMedia';
import { useGroup, useRouteGroup } from '../state/groups';
import { Group } from '../types/groups';
import { channelHref } from '../logic/utils';
import Divider from './Divider';
import LeftIcon from './icons/LeftIcon';
import XIcon from './icons/XIcon';
import RetainedStateLink from './RetainedStateLink';
import SidebarLink from './Sidebar/SidebarLink';

function ChannelList({ group, flag }: { group: Group; flag: string }) {
  return (
    <ul>
      {Object.entries(group.channels).map(([key, channel]) => (
        <li key={key}>
          <SidebarLink to={channelHref(flag, key)}>
            {channel.meta.title || key}
          </SidebarLink>
        </li>
      ))}
    </ul>
  );
}

export default function GroupSidebar() {
  const flag = useRouteGroup();
  const group = useGroup(flag);
  const location = useLocation();
  const isMobile = useIsMobile();
  const routeState = location.state as ModalLocationState | null;

  return (
    <nav
      className={classNames(
        'h-full border-r-2 border-gray-50 bg-white',
        !isMobile && 'w-64',
        isMobile && 'fixed top-0 left-0 z-40 w-full'
      )}
    >
      {isMobile ? (
        <header className="flex items-center border-b-2 border-gray-50 p-4">
          <RetainedStateLink to="/" className="flex items-center">
            <LeftIcon className="h-5 w-5 text-gray-500" />
            <h1 className="text-lg font-bold">{group?.meta.title}</h1>
          </RetainedStateLink>
          {routeState?.backgroundLocation ? (
            <Link
              to={routeState.backgroundLocation}
              className="icon-button ml-auto h-8 w-8"
              aria-label="Close Channels Menu"
            >
              <XIcon className="h-6 w-6" />
            </Link>
          ) : null}
        </header>
      ) : null}
      <div className="h-full overflow-y-auto p-2">
        <div className="p-2">
          <h1 className="mb-2 font-semibold">{group?.meta.title}</h1>
          <p>{group?.meta.description}</p>
        </div>
        <ul>
          <SidebarLink to={`/groups/${flag}/channels/new`}>
            New Channel
          </SidebarLink>
          <SidebarLink to={`/groups/${flag}/members`}>Members</SidebarLink>
          <SidebarLink
            to={`/gangs/~zod/structure`}
            state={{ backgroundLocation: location }}
          >
            Test Overlay
          </SidebarLink>
          <SidebarLink to={`/groups/${flag}/roles`}>Roles</SidebarLink>
          <SidebarLink to={`/groups/${flag}/policy`}>Policy</SidebarLink>
        </ul>
        <Divider>Channels</Divider>
        {group ? <ChannelList group={group} flag={flag} /> : null}
      </div>
    </nav>
  );
}
