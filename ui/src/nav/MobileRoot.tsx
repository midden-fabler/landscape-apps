import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { debounce } from 'lodash';
import useGroupSort from '@/logic/useGroupSort';
import { usePinnedGroups } from '@/state/chat';
import { useGangList, useGroupsWithQuery } from '@/state/groups';
import GroupList from '@/components/Sidebar/GroupList';
import SidebarSorter from '@/components/Sidebar/SidebarSorter';
import GroupsSidebarItem from '@/components/Sidebar/GroupsSidebarItem';
import GangItem from '@/components/Sidebar/GangItem';
import { GroupsScrollingContext } from '@/components/Sidebar/GroupsScrollingContext';
import ReconnectingSpinner from '@/components/ReconnectingSpinner';
import MobileHeader from '@/components/MobileHeader';
import Layout from '@/components/Layout/Layout';
import AddIconMobileNav from '@/components/icons/AddIconMobileNav';
import MagnifyingGlass16Icon from '@/components/icons/MagnifyingGlass16Icon';

export default function MobileRoot() {
  const [isScrolling, setIsScrolling] = useState(false);
  const scroll = useRef(
    debounce((scrolling: boolean) => setIsScrolling(scrolling), 200)
  );
  const { sortFn, setSortFn, sortOptions, sortGroups } = useGroupSort();
  const { data: groups, isLoading } = useGroupsWithQuery();
  const gangs = useGangList();
  const pinnedGroups = usePinnedGroups();
  const sortedGroups = sortGroups(groups);
  const pinnedGroupsOptions = useMemo(
    () =>
      Object.entries(pinnedGroups).map(([flag]) => (
        <GroupsSidebarItem key={flag} flag={flag} />
      )),
    [pinnedGroups]
  );

  return (
    <Layout
      className="flex-1 bg-white"
      header={
        <MobileHeader
          title="All Groups"
          action={
            <div className="flex h-12 items-center justify-end space-x-2">
              <ReconnectingSpinner />
              <SidebarSorter
                sortFn={sortFn}
                setSortFn={setSortFn}
                sortOptions={sortOptions}
              />
              <Link
                className="default-focus flex text-base"
                to="/groups/new-mobile"
              >
                <AddIconMobileNav className="h-8 w-8 text-black" />
              </Link>
            </div>
          }
        />
      }
    >
      <nav className="flex h-full flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <div className="flex-1">
          {sortedGroups.length === 0 && !isLoading ? (
            <div className="mx-4 my-2 rounded-lg bg-indigo-50 p-4 leading-5 text-gray-700 dark:bg-indigo-900/50">
              Tap the <span className="sr-only">find icon</span>
              <MagnifyingGlass16Icon className="inline-flex h-4 w-4" /> below to
              find new groups in your network or view group invites.
            </div>
          ) : (
            <GroupsScrollingContext.Provider value={isScrolling}>
              <GroupList
                groups={sortedGroups}
                pinnedGroups={Object.entries(pinnedGroups)}
                isScrolling={scroll.current}
              >
                {Object.entries(pinnedGroups).length > 0 && (
                  <>
                    <div className="px-4">
                      <h2 className="mb-0.5 p-2 font-system-sans  text-gray-900">
                        Pinned Groups
                      </h2>
                      {pinnedGroupsOptions}
                    </div>
                    <h2 className="my-2 ml-2 p-2 pl-4 font-system-sans  text-gray-900">
                      All Groups
                    </h2>
                  </>
                )}

                <div className="px-4">
                  {gangs.map((flag) => (
                    <GangItem key={flag} flag={flag} />
                  ))}
                </div>
              </GroupList>
            </GroupsScrollingContext.Provider>
          )}
        </div>
      </nav>
    </Layout>
  );
}
