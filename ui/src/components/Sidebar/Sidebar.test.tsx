/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { describe, expect, it } from 'vitest';
import { createMockGroup } from '@/mocks/groups';
import { Group } from '@/types/groups';
import { render } from '../../../test/utils';
import Sidebar from './Sidebar';

const fakeFlag = '~zod/tlon';
const fakeGroup: Group = createMockGroup('Fake Group');

vi.mock('@/state/chat', () => ({
  useBriefs: () => ({}),
  usePinnedGroups: () => ({}),
  usePinned: () => [],
  usePinnedDms: () => [],
  usePinnedClubs: () => [],
  usePendingDms: () => [],
  usePendingMultiDms: () => [],
  useChats: () => [],
  useGetLatestChat: () => () => 0,
  useGetLatestCurio: () => () => 0,
  useGetLatestNote: () => () => 0,
  useMultiDms: () => [],
  useDms: () => [],
}));

vi.mock('@/state/groups', () => ({
  useGroup: () => fakeGroup,
  useRouteGroup: () => fakeFlag,
  useGroupsInitialized: () => true,
  useGroups: () => [fakeFlag, fakeGroup],
  useGroupFlag: () => fakeFlag,
  usePendingInvites: () => [],
  useGangList: () => [],
}));

vi.mock('@/state/hark', () => ({
  useSkeins: () => ({}),
}));

vi.mock('@/logic/useMigrationInfo', () => ({
  useHasMigratedChannels: () => true,
}));

vi.mock('@/logic/utils', () => ({
  createStorageKey: () => 'fake-key',
  randomIntInRange: () => 100,
  normalizeUrbitColor: () => '#ffffff',
  hasKeys: () => false,
  randomElement: (a: any[]) => a[0],
}));

describe('Sidebar', () => {
  it('renders as expected', () => {
    const { asFragment } = render(<Sidebar />);
    expect(asFragment()).toMatchSnapshot();
  });
});
