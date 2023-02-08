/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { createChannel, createMockGroup } from '@/mocks/groups';
import { Group } from '@/types/groups';
import { describe, expect, it } from 'vitest';
import { render } from '../../../test/utils';
import ChannelList from './ChannelList';

const fakeFlag = '~zod/tlon';
const fakeGroup: Group = createMockGroup('Fake Group');
fakeGroup.channels[fakeFlag] = createChannel('Fake Channel');
const fakeVessel = fakeGroup.fleet['~hastuc-dibtux'];

vi.mock('@/state/groups', () => ({
  useGroup: () => fakeGroup,
  useRouteGroup: () => fakeFlag,
  useGroupFlag: () => fakeFlag,
  useVessel: () => fakeVessel,
  useGroupState: () => ({}),
}));

vi.mock('@/logic/useMigrationInfo', () => ({
  useStartedMigration: () => ({
    hasStarted: (ship: string) => true,
  }),
}));

describe('ChannelList', () => {
  it('renders as expected', () => {
    const { asFragment } = render(<ChannelList />);
    expect(asFragment()).toMatchSnapshot();
  });
});
