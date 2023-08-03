import _ from 'lodash';
import bigInt, { BigInteger } from 'big-integer';
import { unstable_batchedUpdates as batchUpdates } from 'react-dom';
import produce, { setAutoFreeze } from 'immer';
import { BigIntOrderedMap, decToUd, udToDec, unixToDa } from '@urbit/api';
import { useCallback, useEffect, useMemo } from 'react';
import {
  CurioDelta,
  Heap,
  HeapAction,
  HeapBriefUpdate,
  HeapCurio,
  HeapDiff,
  HeapFlag,
  HeapPerm,
  HeapSaid,
  HeapDisplayMode,
  HeapJoin,
  HeapCreate,
  HeapCurios,
  HeapCurioMap,
} from '@/types/heap';
import api from '@/api';
import { nestToFlag, canWriteChannel, restoreMap } from '@/logic/utils';
import useNest from '@/logic/useNest';
import { getPreviewTracker } from '@/logic/subscriptionTracking';
import { HeapState } from './type';
import makeCuriosStore from './curios';
import { useGroup, useVessel } from '../groups';
import { createState } from '../base';
import useSchedulerStore from '../scheduler';

setAutoFreeze(false);

function subscribeOnce<T>(app: string, path: string) {
  return new Promise<T>((resolve) => {
    api.subscribe({
      app,
      path,
      event: resolve,
    });
  });
}

function heapAction(flag: HeapFlag, diff: HeapDiff) {
  return {
    app: 'heap',
    mark: 'heap-action-0',
    json: {
      flag,
      update: {
        time: '',
        diff,
      },
    },
  };
}

function heapCurioDiff(flag: HeapFlag, time: string, delta: CurioDelta) {
  return heapAction(flag, {
    curios: {
      time,
      delta,
    },
  });
}

function getTime() {
  return decToUd(unixToDa(Date.now()).toString());
}

export const useHeapState = createState<HeapState>(
  'heap',
  (set, get) => ({
    set: (fn) => {
      set(produce(get(), fn));
    },
    batchSet: (fn) => {
      batchUpdates(() => {
        get().set(fn);
      });
    },
    stash: {},
    curios: {},
    loadedRefs: {},
    briefs: {},
    pendingImports: {},
    markRead: async (flag) => {
      await api.poke({
        app: 'heap',
        mark: 'heap-remark-action',
        json: {
          flag,
          diff: { read: null },
        },
      });
    },
    start: async ({ briefs, stash }) => {
      get().batchSet((draft) => {
        draft.briefs = briefs;
        draft.stash = stash;
      });

      api.subscribe({
        app: 'heap',
        path: '/briefs',
        event: (event: unknown, mark: string) => {
          if (mark === 'heap-leave') {
            get().batchSet((draft) => {
              delete draft.briefs[event as string];
            });
            return;
          }

          const { flag, brief } = event as HeapBriefUpdate;
          get().batchSet((draft) => {
            draft.briefs[flag] = brief;
          });
        },
      });

      api.subscribe({
        app: 'heap',
        path: '/ui',
        event: (event: HeapAction) => {
          get().batchSet((draft) => {
            const {
              flag,
              update: { diff },
            } = event;
            const heap = draft.stash[flag];

            if ('view' in diff) {
              heap.view = diff.view;
            } else if ('del-sects' in diff) {
              heap.perms.writers = heap.perms.writers.filter(
                (w) => !diff['del-sects'].includes(w)
              );
            } else if ('add-sects' in diff) {
              heap.perms.writers = heap.perms.writers.concat(diff['add-sects']);
            }
          });
        },
      });
    },
    joinHeap: async (group, chan) => {
      await api.trackedPoke<HeapJoin, HeapAction>(
        {
          app: 'heap',
          mark: 'channel-join',
          json: {
            group,
            chan,
          },
        },
        { app: 'heap', path: 'ui' },
        (event) => event.flag === chan && 'create' in event.update.diff
      );
    },
    leaveHeap: async (flag) => {
      await api.poke({
        app: 'heap',
        mark: 'heap-leave',
        json: flag,
      });
    },
    viewHeap: async (flag, view) => {
      await api.poke(
        heapAction(flag, {
          view,
        })
      );
    },
    addCurio: async (flag, heart) => {
      await api.poke(heapCurioDiff(flag, getTime(), { add: heart }));
    },
    delCurio: async (flag, time) => {
      const ud = decToUd(time);
      await api.poke(heapCurioDiff(flag, ud, { del: null }));
    },
    editCurio: async (flag, time, heart) => {
      const ud = decToUd(time);
      await api.poke(heapCurioDiff(flag, ud, { edit: heart }));
    },
    create: async (req) => {
      get().batchSet((draft) => {
        const flag = `${window.our}/${req.name}`;
        draft.stash[flag] = {
          perms: { writers: [], group: req.group },
          view: 'grid',
          saga: null,
        };
        draft.curios[flag] = new BigIntOrderedMap<HeapCurio>();
      });
      await api.trackedPoke<HeapCreate, HeapAction>(
        {
          app: 'heap',
          mark: 'heap-create',
          json: req,
        },
        { app: 'heap', path: '/ui' },
        (event) => {
          const { update, flag } = event;
          return (
            'create' in update.diff && flag === `${window.our}/${req.name}`
          );
        }
      );
    },
    addSects: async (flag, sects) => {
      await api.poke(heapAction(flag, { 'add-sects': sects }));
      const perms = await api.scry<HeapPerm>({
        app: 'heap',
        path: `/heap/${flag}/perm`,
      });
      get().batchSet((draft) => {
        draft.stash[flag].perms = perms;
      });
    },
    delSects: async (flag, sects) => {
      await api.poke(heapAction(flag, { 'del-sects': sects }));
      const perms = await api.scry<HeapPerm>({
        app: 'heap',
        path: `/heap/${flag}/perm`,
      });
      get().batchSet((draft) => {
        draft.stash[flag].perms = perms;
      });
    },
    fetchCurio: async (flag, time) => {
      const ud = decToUd(time);
      const curio = await api.scry<HeapCurio>({
        app: 'heap',
        path: `/heap/${flag}/curios/curio/id/${ud}`,
      });
      get().batchSet((draft) => {
        draft.curios[flag] = draft.curios[flag].set(bigInt(time), curio);
      });
    },
    addFeel: async (flag, time, feel) => {
      const ud = decToUd(time);
      await api.poke(
        heapCurioDiff(flag, ud, {
          'add-feel': {
            time: ud,
            feel,
            ship: window.our,
          },
        })
      );
    },
    delFeel: async (flag, time) => {
      const ud = decToUd(time);
      await api.poke(
        heapCurioDiff(flag, ud, {
          'del-feel': window.our,
        })
      );
    },
    initialize: async (flag) => {
      useSchedulerStore.getState().wait(async () => {
        const perms = await api.scry<HeapPerm>({
          app: 'heap',
          path: `/heap/${flag}/perm`,
        });
        get().batchSet((draft) => {
          const heap = { perms, view: 'grid' as HeapDisplayMode, saga: null };
          draft.stash[flag] = heap;
        });
      }, 1);

      await makeCuriosStore(
        flag,
        get,
        `/heap/${flag}/curios`,
        `/heap/${flag}/ui`
      ).initialize();
    },
    initImports: (init) => {
      get().batchSet((draft) => {
        draft.pendingImports = init;
      });
    },
  }),
  {
    partialize: (state) => {
      const saved = _.pick(state, ['briefs', 'stash', 'curios']);

      return saved;
    },
    merge: (state, current) => {
      const curios: {
        [flag: HeapFlag]: HeapCurioMap;
      } = {};

      Object.entries(state.curios).forEach(([k, c]) => {
        curios[k] = restoreMap<HeapCurio>(c);
      });

      return {
        ...current,
        ...state,
        curios,
      };
    },
  },
  []
);

export function useCurios(flag: HeapFlag) {
  const def = useMemo(() => new BigIntOrderedMap<HeapCurio>(), []);
  return useHeapState(useCallback((s) => s.curios[flag] || def, [flag, def]));
}

const defaultPerms = {
  writers: [],
};

export function useHeapPerms(flag: HeapFlag) {
  return useHeapState(
    useCallback((s) => s.stash[flag]?.perms || defaultPerms, [flag])
  );
}

export function useCanWriteToHeap(groupFlag: string) {
  const group = useGroup(groupFlag);
  const vessel = useVessel(groupFlag, window.our);
  const nest = useNest();
  const perms = useHeapPerms(nest);
  const canWrite = canWriteChannel(perms, vessel, group?.bloc);

  return canWrite;
}

export function useHeapIsJoined(flag: HeapFlag) {
  return useHeapState(
    useCallback((s) => Object.keys(s.briefs).includes(flag), [flag])
  );
}

export function useAllCurios() {
  return useHeapState(useCallback((s) => s.curios, []));
}

export function useCurrentCuriosSize(flag: HeapFlag) {
  return useHeapState(useCallback((s) => s.curios[flag]?.size ?? 0, [flag]));
}

export function useComments(flag: HeapFlag, time: string) {
  const curios = useCurios(flag);
  return useMemo(() => {
    if (!curios) {
      return new BigIntOrderedMap<HeapCurio>();
    }

    const curio = curios.get(bigInt(time));
    const replies = (curio?.seal?.replied || ([] as number[]))
      .map((r: string) => {
        const t = bigInt(udToDec(r));
        const c = curios.get(t);
        return c ? ([t, c] as const) : undefined;
      })
      .filter((r: unknown): r is [BigInteger, HeapCurio] => !!r) as [
      BigInteger,
      HeapCurio
    ][];
    return new BigIntOrderedMap<HeapCurio>().gas(replies);
  }, [curios, time]);
}

export function useCurio(flag: HeapFlag, time: string) {
  const curios = useCurios(flag);
  return useMemo(() => {
    const t = bigInt(time);

    if (curios.size === 0 || !curios.has(t)) {
      return undefined;
    }

    return [t, curios.get(t)] as const;
  }, [time, curios]);
}

export function useHeap(flag: HeapFlag): Heap | undefined {
  return useHeapState(useCallback((s) => s.stash[flag], [flag]));
}

export function useBriefs() {
  return useHeapState(useCallback((s: HeapState) => s.briefs, []));
}

export function useOrderedCurios(
  flag: HeapFlag,
  currentId: bigInt.BigInteger | string
) {
  const curios = useCurios(flag);
  const sortedCurios = Array.from(curios).filter(
    ([, c]) => c.heart.replying === null
  );
  sortedCurios.sort(([a], [b]) => b.compare(a));

  const curioId = typeof currentId === 'string' ? bigInt(currentId) : currentId;
  const hasNext = curios.size > 0 && curioId.lt(curios.peekLargest()[0]);
  const hasPrev = curios.size > 0 && curioId.gt(curios.peekSmallest()[0]);
  const currentIdx = sortedCurios.findIndex(([i, _c]) => i.eq(curioId));
  const nextCurio = hasNext ? sortedCurios[currentIdx - 1] : null;
  const prevCurio = hasPrev ? sortedCurios[currentIdx + 1] : null;

  return {
    hasNext,
    hasPrev,
    nextCurio,
    prevCurio,
    sortedCurios,
  };
}

export function useGetLatestCurio() {
  const def = useMemo(() => new BigIntOrderedMap<HeapCurio>(), []);
  const empty = [bigInt(), null];
  const allCurios = useAllCurios();

  return (chFlag: string) => {
    const curioFlag = chFlag.startsWith('~') ? chFlag : nestToFlag(chFlag)[1];
    const curios = allCurios[curioFlag] ?? def;
    return curios.size > 0 ? curios.peekLargest() : empty;
  };
}

const { shouldLoad, newAttempt, finished } = getPreviewTracker();

const selRefs = (s: HeapState) => s.loadedRefs;
export function useRemoteCurio(flag: string, time: string, blockLoad: boolean) {
  const refs = useHeapState(selRefs);
  const path = `/said/${flag}/curio/${decToUd(time)}`;
  const cached = refs[path];

  useEffect(() => {
    if (!blockLoad && shouldLoad(path)) {
      newAttempt(path);
      subscribeOnce<HeapSaid>('heap', path)
        .then(({ curio }) => {
          useHeapState.getState().batchSet((draft) => {
            draft.loadedRefs[path] = curio;
          });
        })
        .finally(() => finished(path));
    }
  }, [path, blockLoad]);

  return cached;
}

(window as any).heap = useHeapState.getState;
