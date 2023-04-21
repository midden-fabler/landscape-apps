import React, { useCallback, useMemo } from 'react';
import { useGroup, useRouteGroup } from '@/state/groups';
import ChannelsListDropContext from './ChannelsListDropContext';
import { SectionMap } from './types';
import useChannelSearch from './useChannelSearch';

export default function ChannelsList() {
  const flag = useRouteGroup();
  const group = useGroup(flag);
  const { searchInput } = useChannelSearch();

  const getSectionedChannels = useMemo(() => {
    const sectionedChannels: SectionMap = {};

    if (group) {
      group['zone-ord'].forEach((zone) => {
        sectionedChannels[zone] = {
          title: group.zones[zone]?.meta.title || '',
          channels: [],
        };
      });

      Object.entries(group.zones).forEach(([key, zone]) => {
        const orderedChannels = (zone.idx || []).map((idx) => ({
          key: idx,
          channel: group.channels[idx],
        }));
        if (sectionedChannels[key]) {
          sectionedChannels[key].channels = orderedChannels.filter(
            (channelItem) => key === channelItem.channel?.zone
          );
        }
      });
    }

    return sectionedChannels;
  }, [group]);

  const getFilteredSectionedChannels = useCallback(() => {
    const filteredSectionedChannels: SectionMap = {};
    if (searchInput !== '') {
      return Object.entries(getSectionedChannels).reduce(
        (acc, [key, section]) => {
          const filteredChannels = section.channels.filter((channelItem) => {
            const { channel } = channelItem;
            const title = channel?.meta.title.toLowerCase();
            const description = channel?.meta.description.toLowerCase();
            const search = searchInput.toLowerCase();

            if (section.title.toLowerCase().includes(search)) {
              return true;
            }

            if (title.includes(search) || description.includes(search)) {
              return true;
            }

            return false;
          });

          if (filteredChannels.length) {
            filteredSectionedChannels[key] = {
              title: section.title,
              channels: filteredChannels,
            };
          }

          return filteredSectionedChannels;
        },
        filteredSectionedChannels
      );
    }

    return getSectionedChannels;
  }, [getSectionedChannels, searchInput]);

  return (
    <ChannelsListDropContext
      sectionedChannels={getFilteredSectionedChannels()}
    />
  );
}
