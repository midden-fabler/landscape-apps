import cookies from 'browser-cookies';
import { useCallback, useEffect } from 'react';
import { Gangs } from '@/types/groups';
import {
  useGroupJoinMutation,
  usePendingGangsWithoutClaim,
} from '@/state/groups';
import useNavigateByApp from '@/logic/useNavigateByApp';

export default function LureAutojoiner(): React.ReactElement {
  const { mutateAsync: joinMutation } = useGroupJoinMutation();
  const navigateByApp = useNavigateByApp();

  const pendingGangsWithoutClaim = usePendingGangsWithoutClaim();

  const autojoin = useCallback(
    (pendingGangs: Gangs) => {
      Object.entries(pendingGangs).map(async ([flag, gang]) => {
        const cookieName = `lure-join-${flag}`.replace('/', '--');

        if (!gang.claim) {
          if (cookies.get(cookieName)) {
            await joinMutation({ flag });
            cookies.erase(cookieName);
            navigateByApp(`/groups/${flag}`);
          }
        }
      });
    },
    [joinMutation, navigateByApp]
  );

  useEffect(() => {
    if (Object.keys(pendingGangsWithoutClaim).length) {
      autojoin(pendingGangsWithoutClaim);
    }
  }, [pendingGangsWithoutClaim, autojoin]);

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <></>;
}
