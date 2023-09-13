import { useCallback, useEffect, useState, useMemo } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router';
import * as Toast from '@radix-ui/react-toast';
import { Helmet } from 'react-helmet';
import bigInt from 'big-integer';
import { VirtuosoGrid } from 'react-virtuoso';
import { ViewProps } from '@/types/groups';
import Layout from '@/components/Layout/Layout';
import { useRouteGroup } from '@/state/groups/groups';
import {
  useHeapPerms,
  useMarkHeapReadMutation,
  useJoinHeapMutation,
  useInfiniteCurioBlocks,
} from '@/state/heap/heap';
import { useHeapSortMode, useHeapDisplayMode } from '@/state/settings';
import HeapBlock from '@/heap/HeapBlock';
import HeapRow from '@/heap/HeapRow';
import useDismissChannelNotifications from '@/logic/useDismissChannelNotifications';
import { GRID, HeapCurio } from '@/types/heap';
import { useIsMobile } from '@/logic/useMedia';
import { useFullChannel } from '@/logic/channel';
import { useDragAndDrop } from '@/logic/DragAndDropContext';
import { PASTEABLE_IMAGE_TYPES } from '@/constants';
import { useUploader } from '@/state/storage';
import X16Icon from '@/components/icons/X16Icon';
import HeapHeader from './HeapHeader';
import HeapPlaceholder from './HeapPlaceholder';

function HeapChannel({ title }: ViewProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { chShip, chName } = useParams();
  const chFlag = `${chShip}/${chName}`;
  const nest = `heap/${chFlag}`;
  const groupFlag = useRouteGroup();
  const { mutateAsync: join } = useJoinHeapMutation();
  const perms = useHeapPerms(chFlag);
  const {
    group,
    groupChannel: channel,
    canWrite,
    compat: { compatible },
  } = useFullChannel({ groupFlag, nest, writers: perms.writers, join });

  const displayMode = useHeapDisplayMode(chFlag);
  const [addCurioOpen, setAddCurioOpen] = useState(false);
  // for now sortMode is not actually doing anything.
  // need input from design/product on what we want it to actually do, it's not spelled out in figma.
  const sortMode = useHeapSortMode(chFlag);
  const { curios, fetchNextPage, hasNextPage, isLoading } =
    useInfiniteCurioBlocks(chFlag);
  const { mutate: markRead, isLoading: isMarking } = useMarkHeapReadMutation();
  const dropZoneId = useMemo(() => `new-curio-input-${chFlag}`, [chFlag]);
  const { isDragging, isOver, droppedFiles, setDroppedFiles } =
    useDragAndDrop(dropZoneId);
  const [draggedFile, setDraggedFile] = useState<File | null>(null);
  const uploadKey = useMemo(() => `new-curio-input-${chFlag}`, [chFlag]);
  const uploader = useUploader(uploadKey);
  const dragEnabled = !isMobile && compatible;
  const showDragTarget =
    dragEnabled && !isLoading && !addCurioOpen && isDragging && isOver;
  const [dragErrorMessage, setDragErrorMessage] = useState('');

  const navigateToDetail = useCallback(
    (time: bigInt.BigInteger) => {
      navigate(`curio/${time}`);
    },
    [navigate]
  );

  useDismissChannelNotifications({
    nest,
    markRead: useCallback(() => markRead({ flag: chFlag }), [markRead, chFlag]),
    isMarking,
  });

  const renderCurio = useCallback(
    (i: number, curio: HeapCurio, time: bigInt.BigInteger) => (
      <div key={time.toString()} tabIndex={0} className="cursor-pointer">
        {displayMode === GRID ? (
          <div className="aspect-h-1 aspect-w-1">
            <HeapBlock curio={curio} time={time.toString()} />
          </div>
        ) : (
          <div onClick={() => navigateToDetail(time)}>
            <HeapRow
              key={time.toString()}
              curio={curio}
              time={time.toString()}
            />
          </div>
        )}
      </div>
    ),
    [displayMode, navigateToDetail]
  );

  const getCurioTitle = (curio: HeapCurio) =>
    curio.heart.title ||
    curio.heart.content.toString().split(' ').slice(0, 3).join(' ');

  const empty = useMemo(() => Array.from(curios).length === 0, [curios]);
  const sortedCurios = Array.from(curios)
    .sort(([a], [b]) => {
      if (sortMode === 'time') {
        return b.compare(a);
      }
      if (sortMode === 'alpha') {
        const curioA = curios.get(a);
        const curioB = curios.get(b);

        return getCurioTitle(curioA).localeCompare(getCurioTitle(curioB));
      }
      return b.compare(a);
    })
    .filter(([, c]) => !c.heart.replying); // defensive, they should all be blocks

  const loadOlderCurios = useCallback(
    (atBottom: boolean) => {
      if (atBottom && hasNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage]
  );

  const computeItemKey = (
    _i: number,
    [time, _curio]: [bigInt.BigInteger, HeapCurio]
  ) => time.toString();

  const thresholds = {
    atBottomThreshold: isMobile ? 125 : 250,
    atTopThreshold: isMobile ? 1200 : 2500,
    overscan: isMobile
      ? { main: 200, reverse: 200 }
      : { main: 400, reverse: 400 },
  };

  const handleDrop = useCallback((fileList: FileList) => {
    const uploadFile = Array.from(fileList).find((file) =>
      PASTEABLE_IMAGE_TYPES.includes(file.type)
    );
    if (uploadFile) {
      setDraggedFile(uploadFile);
    } else {
      setDragErrorMessage('Only images can be uploaded');
    }
  }, []);

  const clearDragState = useCallback(() => {
    setDragErrorMessage('');
    setDraggedFile(null);
    setDroppedFiles((prev) => {
      if (prev) {
        const { [dropZoneId]: _files, ...rest } = prev;
        return rest;
      }
      return prev;
    });
  }, [dropZoneId, setDroppedFiles, setDraggedFile]);

  useEffect(() => {
    if (dragEnabled && droppedFiles && droppedFiles[dropZoneId]) {
      if (uploader) {
        handleDrop(droppedFiles[dropZoneId]);
      } else {
        setDragErrorMessage('Remote storage must be enabled to upload files');
      }
    }
  }, [droppedFiles, handleDrop, dropZoneId, dragEnabled, uploader]);

  const DragDisplay = useCallback(
    () => (
      <div
        id={dropZoneId}
        className="absolute top-0 left-0 flex h-full w-full items-center justify-center bg-gray-50 p-10 opacity-95"
      >
        <div className="flex h-full w-full items-center justify-center rounded-lg border-[3px] border-dashed border-gray-200">
          <div className="text-lg font-bold">Drop Attachments Here</div>
        </div>
      </div>
    ),
    [dropZoneId]
  );

  return (
    <Layout
      className="flex-1 bg-white sm:pt-0"
      aside={<Outlet />}
      header={
        <HeapHeader
          groupFlag={groupFlag}
          nest={nest}
          display={displayMode}
          sort={sortMode}
          canWrite={canWrite}
          draggedFile={draggedFile}
          clearDragState={clearDragState}
          addCurioOpen={addCurioOpen}
          setAddCurioOpen={setAddCurioOpen}
          dragErrorMessage={dragErrorMessage}
        />
      }
    >
      <Helmet>
        <title>
          {channel && group
            ? `${channel.meta.title} in ${group.meta.title} ${title}`
            : title}
        </title>
      </Helmet>
      <div id={dropZoneId} className="h-full bg-gray-50 p-4">
        {empty && isLoading ? (
          <div className="h-full w-full">
            <HeapPlaceholder count={30} />
          </div>
        ) : (
          <VirtuosoGrid
            data={sortedCurios}
            itemContent={(i, [time, curio]) => renderCurio(i, curio, time)}
            computeItemKey={computeItemKey}
            style={{ height: '100%', width: '100%', paddingTop: '1rem' }}
            atBottomStateChange={loadOlderCurios}
            listClassName={
              displayMode === 'list'
                ? 'heap-list'
                : isMobile
                ? 'heap-grid-mobile'
                : 'heap-grid'
            }
            {...thresholds}
          />
        )}
        {showDragTarget && <DragDisplay />}
        <Toast.Provider>
          <Toast.Root
            duration={5000}
            defaultOpen={false}
            open={!addCurioOpen && dragErrorMessage !== ''}
            onOpenChange={() => setDragErrorMessage('')}
          >
            <Toast.Description asChild>
              <div
                className="absolute top-0 left-0 z-50 flex w-full cursor-pointer items-start justify-center border-green"
                onClick={() => setDragErrorMessage('')}
              >
                <div className="mt-2 rounded-lg bg-red-100 p-4 font-semibold text-red shadow-sm">
                  {dragErrorMessage}
                  <X16Icon className="ml-2 inline h-4 w-4" />
                </div>
              </div>
            </Toast.Description>
          </Toast.Root>
          <Toast.Viewport label="Note successfully published" />
        </Toast.Provider>
      </div>
    </Layout>
  );
}

export default HeapChannel;
