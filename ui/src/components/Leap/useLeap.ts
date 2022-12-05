import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { getFlagParts, nestToFlag } from '@/logic/utils';
import { useGroups } from '@/state/groups';
import { Group, GroupChannel } from '@/types/groups';
import {
  LEAP_DESCRIPTION_TRUNCATE_LENGTH,
  LEAP_RESULT_TRUNCATE_SIZE,
} from '@/constants';
import { useContacts } from '@/state/contact';
import menuOptions from './MenuOptions';
import GroupIcon from '../icons/GroupIcon';
import PersonIcon from '../icons/PersonIcon';
import UnknownAvatarIcon from '../icons/UnknownAvatarIcon';
import BubbleIcon from '../icons/BubbleIcon';
import ShapesIcon from '../icons/ShapesIcon';
import NotebookIcon from '../icons/NotebookIcon';

export default function useLeap() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const groups = useGroups();
  const contacts = useContacts();

  const menu =
    inputValue === ''
      ? menuOptions.map((o, idx) => ({
          ...o,
          onSelect: () => {
            navigate(o.to);
            setIsOpen(false);
            setSelectedIndex(0);
          },
          resultIndex: idx,
        }))
      : [];

  const shipResults = useMemo(() => {
    if (inputValue === '') {
      return [];
    }

    return [
      {
        section: 'Ships',
      },
      ...Object.entries(contacts)
        .filter(
          ([patp, contact]) =>
            patp.includes(inputValue) || contact.nickname.includes(inputValue)
        )
        .map(([patp, contact], idx) => {
          const onSelect = () => {
            navigate(`/groups/profile/${patp}`);
            setSelectedIndex(0);
            setInputValue('');
            setIsOpen(false);
          };
          return {
            onSelect,
            icon: PersonIcon,
            title: patp,
            subtitle: (contact.status || contact.bio || '').slice(
              0,
              LEAP_DESCRIPTION_TRUNCATE_LENGTH
            ),
            to: `/groups/profile/${patp}`,
            resultIndex: idx,
          };
        }),
    ];
  }, [contacts, inputValue, navigate]);

  const channelResults = useMemo(() => {
    if (inputValue === '') {
      return [];
    }

    const allChannels = Object.entries(groups).reduce(
      (memo, [groupFlag, group]) =>
        [
          ...memo,
          Object.entries(group.channels).map(([nest, channel]) => ({
            groupFlag,
            group,
            nest,
            channel,
          })),
        ].flat(),
      [] as {
        groupFlag: string;
        group: Group;
        nest: string;
        channel: GroupChannel;
      }[]
    );

    return [
      {
        section: 'Channels',
      },
      ...allChannels
        .filter(({ channel }) =>
          channel.meta.title.toLowerCase().includes(inputValue.toLowerCase())
        )
        .map(({ groupFlag, group, channel, nest }, idx) => {
          const [chType, chFlag] = nestToFlag(nest);
          const onSelect = () => {
            navigate(`/groups/${groupFlag}/channels/chat/${chFlag}`);
            setSelectedIndex(0);
            setInputValue('');
            setIsOpen(false);
          };
          let channelIcon;
          switch (chType) {
            case 'chat':
              channelIcon = BubbleIcon;
              break;
            case 'heap':
              channelIcon = ShapesIcon;
              break;
            case 'diary':
              channelIcon = NotebookIcon;
              break;
            default:
              channelIcon = UnknownAvatarIcon;
          }
          return {
            onSelect,
            icon: channelIcon,
            title: channel.meta.title,
            subtitle:
              channel.meta.description.slice(
                0,
                LEAP_DESCRIPTION_TRUNCATE_LENGTH
              ) || group.meta.title,
            to: `/groups/${groupFlag}/channels/chat/${chFlag}`,
            resultIndex:
              idx + (shipResults.length > 0 ? shipResults.length - 1 : 0),
          };
        }),
    ];
  }, [groups, inputValue, navigate, shipResults.length]);

  const groupResults = useMemo(() => {
    if (inputValue === '') {
      return [];
    }

    return [
      {
        section: 'Groups',
      },
      ...Object.entries(groups)
        .filter(([_flag, group]) =>
          group.meta.title.toLowerCase().includes(inputValue.toLowerCase())
        )
        .map(([flag, group], idx) => {
          const onSelect = () => {
            navigate(`/groups/${flag}`);
            setSelectedIndex(0);
            setInputValue('');
            setIsOpen(false);
          };
          return {
            onSelect,
            icon: GroupIcon,
            title: group.meta.title,
            subtitle:
              group.meta.description.slice(
                0,
                LEAP_DESCRIPTION_TRUNCATE_LENGTH
              ) || getFlagParts(flag).ship,
            to: `/groups/${flag}`,
            resultIndex:
              idx +
              (shipResults.length > 0 ? shipResults.length - 1 : 0) +
              (channelResults.length > 0 ? channelResults.length - 1 : 0), // -1 for channel result Section header
          };
        }),
    ];
  }, [channelResults.length, groups, inputValue, navigate, shipResults.length]);

  // If changing the order, update the resultIndex calculations above
  const results = [
    ...menu,
    ...(shipResults.length > 1
      ? shipResults.slice(0, LEAP_RESULT_TRUNCATE_SIZE + 1)
      : []), // +1 to account for section header
    ...(channelResults.length > 1
      ? channelResults.slice(0, LEAP_RESULT_TRUNCATE_SIZE + 1)
      : []), // +1 to account for section header
    ...(groupResults.length > 1
      ? groupResults.slice(0, LEAP_RESULT_TRUNCATE_SIZE + 1)
      : []), // +1 to account for section header
  ];

  return {
    isOpen,
    setIsOpen,
    inputValue,
    setInputValue,
    selectedIndex,
    setSelectedIndex,
    results,
    resultCount: results.filter((r) => !('section' in r)).length, // count only non-section results
  };
}
