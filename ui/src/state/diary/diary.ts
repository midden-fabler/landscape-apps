import _ from 'lodash';
import bigInt from 'big-integer';
import { unstable_batchedUpdates as batchUpdates } from 'react-dom';
import produce, { setAutoFreeze } from 'immer';
import { BigIntOrderedMap, decToUd, udToDec, unixToDa } from '@urbit/api';
import { useCallback, useEffect, useMemo } from 'react';
import {
  NoteDelta,
  Diary,
  DiaryBriefUpdate,
  DiaryNote,
  DiaryDiff,
  DiaryFlag,
  DiaryPerm,
  DiaryMemo,
  DiaryQuip,
  DiaryAction,
  DiaryDisplayMode,
  DiaryLetter,
  DiarySaid,
  DiaryUpdate,
  DiaryJoin,
  DiaryCreate,
  DiaryNoteMap,
} from '@/types/diary';
import api from '@/api';
import { nestToFlag, restoreMap } from '@/logic/utils';
import { getPreviewTracker } from '@/logic/subscriptionTracking';
import { DiaryState } from './type';
import makeNotesStore from './notes';
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

function diaryAction(flag: DiaryFlag, diff: DiaryDiff) {
  return {
    app: 'diary',
    mark: 'diary-action-0',
    json: {
      flag,
      update: {
        time: '',
        diff,
      },
    },
  };
}

function diaryNoteDiff(flag: DiaryFlag, time: string, delta: NoteDelta) {
  return diaryAction(flag, {
    notes: {
      time,
      delta,
    },
  });
}

export const useDiaryState = createState<DiaryState>(
  'diary',
  (set, get) => ({
    set: (fn) => {
      set(produce(get(), fn));
    },
    batchSet: (fn) => {
      batchUpdates(() => {
        get().set(fn);
      });
    },
    shelf: {},
    notes: {},
    banter: {},
    loadedNotes: {},
    briefs: {},
    pendingImports: {},
    markRead: async (flag) => {
      await api.poke({
        app: 'diary',
        mark: 'diary-remark-action',
        json: {
          flag,
          diff: { read: null },
        },
      });
    },
    addQuip: async (flag, noteId, content) => {
      const replying = decToUd(noteId);
      // const story: DiaryStory = { block: [], inline: content };
      const memo: DiaryMemo = {
        content,
        author: window.our,
        sent: Date.now(),
      };
      const diff: DiaryDiff = {
        notes: {
          time: replying,
          delta: {
            quips: {
              time: decToUd(unixToDa(Date.now()).toString()),
              delta: {
                add: memo,
              },
            },
          },
        },
      };

      await api.poke(diaryAction(flag, diff));
    },
    delQuip: async (flag, noteId, quipId) => {
      const diff: DiaryDiff = {
        notes: {
          time: decToUd(noteId),
          delta: {
            quips: {
              time: decToUd(quipId),
              delta: {
                del: null,
              },
            },
          },
        },
      };

      await api.poke(diaryAction(flag, diff));
    },
    addFeel: async (flag, noteId, feel) => {
      const diff: DiaryDiff = {
        notes: {
          time: decToUd(noteId),
          delta: {
            'add-feel': {
              time: decToUd(unixToDa(Date.now()).toString()),
              feel,
              ship: window.our,
            },
          },
        },
      };

      await api.poke(diaryAction(flag, diff));
    },
    delFeel: async (flag, noteId) => {
      const diff: DiaryDiff = {
        notes: {
          time: decToUd(noteId),
          delta: {
            'del-feel': window.our,
          },
        },
      };

      await api.poke(diaryAction(flag, diff));
    },
    addQuipFeel: async (flag, noteId, quipId, feel) => {
      const diff: DiaryDiff = {
        notes: {
          time: decToUd(noteId),
          delta: {
            quips: {
              time: decToUd(quipId),
              delta: {
                'add-feel': {
                  feel,
                  ship: window.our,
                },
              },
            },
          },
        },
      };

      await api.poke(diaryAction(flag, diff));
    },
    delQuipFeel: async (flag, noteId, quipId) => {
      const diff: DiaryDiff = {
        notes: {
          time: decToUd(noteId),
          delta: {
            quips: {
              time: decToUd(quipId),
              delta: {
                'del-feel': window.our,
              },
            },
          },
        },
      };

      await api.poke(diaryAction(flag, diff));
    },
    start: async ({ briefs, shelf }) => {
      get().batchSet((draft) => {
        draft.briefs = briefs;
        draft.shelf = shelf;
      });

      api.subscribe({
        app: 'diary',
        path: '/briefs',
        event: (event: unknown, mark: string) => {
          if (mark === 'diary-leave') {
            get().batchSet((draft) => {
              delete draft.briefs[event as string];
            });
            return;
          }

          const { flag, brief } = event as DiaryBriefUpdate;
          get().batchSet((draft) => {
            draft.briefs[flag] = brief;
          });
        },
      });

      api.subscribe({
        app: 'diary',
        path: '/ui',
        event: (event: DiaryAction) => {
          get().batchSet((draft) => {
            const {
              flag,
              update: { diff },
            } = event;
            const diary = draft.shelf[flag];

            if ('view' in diff) {
              diary.view = diff.view;
            } else if ('del-sects' in diff) {
              diary.perms.writers = diary.perms.writers.filter(
                (w) => !diff['del-sects'].includes(w)
              );
            } else if ('add-sects' in diff) {
              diary.perms.writers = diary.perms.writers.concat(
                diff['add-sects']
              );
            }
          });
        },
      });
    },
    fetchNote: async (flag, noteId) => {
      const note = await api.scry<DiaryNote>({
        app: 'diary',
        path: `/diary/${flag}/notes/note/${decToUd(noteId)}`,
      });
      note.type = 'note';
      note.seal.quips = new BigIntOrderedMap<DiaryQuip>().gas(
        Object.entries(note.seal.quips).map(([t, q]: any) => [
          bigInt(udToDec(t)),
          q,
        ])
      );
      get().batchSet((draft) => {
        draft.notes[flag] = draft.notes[flag].set(bigInt(noteId), note);
      });
    },
    joinDiary: async (group, chan) => {
      await api.trackedPoke<DiaryJoin, DiaryAction>(
        {
          app: 'diary',
          mark: 'channel-join',
          json: {
            group,
            chan,
          },
        },
        { app: 'diary', path: '/ui' },
        (event) => event.flag === chan && 'create' in event.update.diff
      );
    },
    leaveDiary: async (flag) => {
      await api.poke({
        app: 'diary',
        mark: 'diary-leave',
        json: flag,
      });
    },
    viewDiary: async (flag, view) => {
      await api.poke(diaryAction(flag, { view }));
    },
    addNote: async (flag, essay) =>
      new Promise<string>((resolve, reject) => {
        let timePosted = '';
        api
          .trackedPoke<DiaryAction, DiaryUpdate>(
            diaryNoteDiff(flag, decToUd(unixToDa(Date.now()).toString()), {
              add: essay,
            }),
            { app: 'diary', path: `/diary/${flag}/ui` },
            (event) => {
              const { time, diff } = event;
              if ('notes' in diff) {
                const { delta } = diff.notes;
                if ('add' in delta && delta.add.sent === essay.sent) {
                  timePosted = time;
                  return true;
                }
              }

              return false;
            }
          )
          .then(() => {
            resolve(timePosted);
          });
      }),
    editNote: async (flag, time, essay) => {
      await api.poke(
        diaryNoteDiff(flag, decToUd(time), {
          edit: essay,
        })
      );
    },
    delNote: async (flag, time) => {
      await api.poke(diaryNoteDiff(flag, time, { del: null }));
    },
    create: async (req) => {
      await api.trackedPoke<DiaryCreate, DiaryAction>(
        {
          app: 'diary',
          mark: 'diary-create',
          json: req,
        },
        { app: 'diary', path: '/ui' },
        (event) => {
          const { update, flag } = event;
          return (
            'create' in update.diff && flag === `${window.our}/${req.name}`
          );
        }
      );
    },
    addSects: async (flag, sects) => {
      await api.poke(diaryAction(flag, { 'add-sects': sects }));
      const perms = await api.scry<DiaryPerm>({
        app: 'diary',
        path: `/diary/${flag}/perm`,
      });
      get().batchSet((draft) => {
        draft.shelf[flag].perms = perms;
      });
    },
    delSects: async (flag, sects) => {
      await api.poke(diaryAction(flag, { 'del-sects': sects }));
      const perms = await api.scry<DiaryPerm>({
        app: 'diary',
        path: `/diary/${flag}/perm`,
      });
      get().batchSet((draft) => {
        draft.shelf[flag].perms = perms;
      });
    },
    getOlderNotes: async (flag: string, count: number) => {
      await makeNotesStore(
        flag,
        get,
        `/diary/${flag}/notes`,
        `/diary/${flag}/ui`
      ).getOlder(count.toString());
    },
    getNewerNotes: async (flag: string, count: number) => {
      await makeNotesStore(
        flag,
        get,
        `/diary/${flag}/notes`,
        `/diary/${flag}/ui`
      ).getNewer(count.toString());
    },
    initialize: async (flag) => {
      useSchedulerStore.getState().wait(async () => {
        const perms = await api.scry<DiaryPerm>({
          app: 'diary',
          path: `/diary/${flag}/perm`,
        });
        get().batchSet((draft) => {
          const diary = { perms, view: 'list' as DiaryDisplayMode };
          draft.shelf[flag] = diary;
        });
      }, 2);

      await makeNotesStore(
        flag,
        get,
        `/diary/${flag}/notes`,
        `/diary/${flag}/ui`
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
      const saved = _.pick(state, ['briefs', 'shelf', 'notes']);

      return saved;
    },
    merge: (state, current) => {
      const notes: {
        [flag: DiaryFlag]: DiaryNoteMap;
      } = {};

      Object.entries(state.notes).forEach(([k, n]) => {
        let noteMap = restoreMap<DiaryLetter>(n);

        noteMap.keys().forEach((key) => {
          const note = noteMap.get(key);
          if ('seal' in note) {
            note.seal.quips = restoreMap<DiaryQuip>(note.seal.quips);
            noteMap = noteMap.set(key, note);
          }
        });

        notes[k] = noteMap;
      });

      return {
        ...current,
        ...state,
        notes,
      };
    },
  },
  []
);

export function useNotes(flag: DiaryFlag): BigIntOrderedMap<DiaryLetter> {
  const def = useMemo(() => new BigIntOrderedMap<DiaryLetter>(), []);
  return useDiaryState(useCallback((s) => s.notes[flag] || def, [flag, def]));
}

const defaultPerms = {
  writers: [],
};

export function useDiaryPerms(flag: DiaryFlag) {
  return useDiaryState(
    useCallback((s) => s.shelf[flag]?.perms || defaultPerms, [flag])
  );
}

export function useDiaryIsJoined(flag: DiaryFlag) {
  return useDiaryState(
    useCallback((s) => Object.keys(s.briefs).includes(flag), [flag])
  );
}

export function useAllNotes() {
  return useDiaryState(useCallback((s: DiaryState) => s.notes, []));
}

export function useCurrentNotesSize(flag: DiaryFlag) {
  return useDiaryState(useCallback((s) => s.notes[flag]?.size ?? 0, [flag]));
}

const emptyNote: DiaryNote = {
  type: 'note',
  seal: { time: '', feels: {}, quips: new BigIntOrderedMap<DiaryQuip>() },
  essay: {
    title: '',
    image: '',
    content: [],
    author: window.our || '',
    sent: Date.now(),
  },
};

const fallback = [bigInt(0), emptyNote] as const;

export function useNote(
  flag: DiaryFlag,
  time: string
): readonly [bigInt.BigInteger, DiaryNote] {
  const notes = useNotes(flag);
  return useMemo(() => {
    const t = bigInt(time);
    if (notes.size === 0 || !notes.has(t)) {
      return fallback;
    }

    const note = notes.get(t);
    if (note.type === 'outline') {
      return fallback;
    }
    return [t, note] as const;
  }, [time, notes]);
}

export function useQuip(flag: DiaryFlag, noteId: string, quipId: string) {
  const [, note] = useNote(flag, noteId);
  return useMemo(() => {
    const quip = note.seal.quips.get(bigInt(quipId));
    return quip;
  }, [note, quipId]);
}

export function useDiary(flag: DiaryFlag): Diary | undefined {
  return useDiaryState(useCallback((s) => s.shelf[flag], [flag]));
}

export function useBriefs() {
  return useDiaryState(useCallback((s: DiaryState) => s.briefs, []));
}

export function useBrief(flag: string) {
  return useDiaryState(useCallback((s: DiaryState) => s.briefs[flag], [flag]));
}

// TODO: this is a WIP part of implementing sorting by most recent comment
// export function useDiaryQuips(flag: string): [bigInt.BigInteger, DiaryQuipMap][] {
//   const def = useMemo(() => new BigIntOrderedMap<DiaryQuipMap>(), []);
//   const notes = useNotesForDiary(flag);
//   const getQuip = useQuips;
//   const quipNotes = Array.from(notes).map(([time, note]) => [time, getQuip(flag, time.toString())]);
// }

export function useGetLatestNote() {
  const def = useMemo(() => new BigIntOrderedMap<DiaryLetter>(), []);
  const empty = [bigInt(), null];
  const allNotes = useAllNotes();

  return (chFlag: string) => {
    const noteFlag = chFlag.startsWith('~') ? chFlag : nestToFlag(chFlag)[1];
    const notes = allNotes[noteFlag] ?? def;
    return notes.size > 0 ? notes.peekLargest() : empty;
  };
}

(window as any).diary = useDiaryState.getState;

export function useDiaryDisplayMode(flag: string): DiaryDisplayMode {
  const diary = useDiary(flag);
  return diary?.view ?? 'grid';
}

const { shouldLoad, newAttempt, finished } = getPreviewTracker();

const selRefs = (s: DiaryState) => s.loadedNotes;
export function useRemoteOutline(
  flag: string,
  time: string,
  blockLoad: boolean
) {
  const refs = useDiaryState(selRefs);
  const path = `/said/${flag}/note/${decToUd(time)}`;
  const cached = refs[path];

  useEffect(() => {
    if (!blockLoad && shouldLoad(path)) {
      newAttempt(path);
      subscribeOnce<DiarySaid>('diary', path)
        .then(({ outline }) => {
          useDiaryState.getState().batchSet((draft) => {
            draft.loadedNotes[path] = outline;
          });
        })
        .finally(() => finished(path));
    }
  }, [path, blockLoad]);

  return cached;
}
