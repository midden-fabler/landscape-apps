import { citeToPath, useCopy } from '@/logic/utils';
import {
  useArrangedNotes,
  useArrangedNotesDiaryMutation,
  useDeleteNoteMutation,
} from '@/state/diary';
import { decToUd } from '@urbit/api';
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';

interface useDiaryActionsParams {
  flag: string;
  time: string;
}

export default function useDiaryActions({ flag, time }: useDiaryActionsParams) {
  const [isOpen, setIsOpen] = useState(false);
  const arrangedNotes = useArrangedNotes(flag);
  const navigate = useNavigate();
  const { mutate: deleteNote } = useDeleteNoteMutation();
  const { mutate: arrangedNotesMutation } = useArrangedNotesDiaryMutation();
  const { doCopy, didCopy } = useCopy(
    citeToPath({
      chan: {
        nest: `diary/${flag}`,
        where: `/note/${time}`,
      },
    })
  );

  const addToArrangedNotes = useCallback(() => {
    const newArranagedNotes = [...arrangedNotes, time.toString()];
    arrangedNotesMutation({
      arrangedNotes: newArranagedNotes,
      flag,
    });
  }, [arrangedNotesMutation, flag, time, arrangedNotes]);

  const removeFromArrangedNotes = useCallback(() => {
    const newArranagedNotes = arrangedNotes.filter(
      (note) => note !== time.toString()
    );
    arrangedNotesMutation({
      arrangedNotes: newArranagedNotes,
      flag,
    });
  }, [arrangedNotesMutation, flag, time, arrangedNotes]);

  const moveUpInArrangedNotes = useCallback(() => {
    const newArranagedNotes = arrangedNotes.filter(
      (note) => note !== time.toString()
    );
    const index = arrangedNotes.indexOf(time.toString());
    newArranagedNotes.splice(index - 1, 0, time.toString());
    arrangedNotesMutation({
      arrangedNotes: newArranagedNotes,
      flag,
    });
  }, [arrangedNotesMutation, flag, time, arrangedNotes]);

  const moveDownInArrangedNotes = useCallback(() => {
    const newArranagedNotes = arrangedNotes.filter(
      (note) => note !== time.toString()
    );
    const index = arrangedNotes.indexOf(time.toString());
    newArranagedNotes.splice(index + 1, 0, time.toString());
    arrangedNotesMutation({
      arrangedNotes: newArranagedNotes,
      flag,
    });
  }, [arrangedNotesMutation, flag, time, arrangedNotes]);

  const delNote = useCallback(async () => {
    deleteNote({ flag, time: decToUd(time) });
    navigate('../');
  }, [flag, time, deleteNote, navigate]);

  const onCopy = useCallback(
    (e) => {
      e.preventDefault();
      doCopy();
    },
    [doCopy]
  );

  return {
    isOpen,
    didCopy,
    setIsOpen,
    onCopy,
    delNote,
    addToArrangedNotes,
    removeFromArrangedNotes,
    moveUpInArrangedNotes,
    moveDownInArrangedNotes,
  };
}
