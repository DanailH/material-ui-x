import * as React from 'react';
import { ColDef } from '../../models/colDef';
import { useLogger } from '../utils';
import { ApiRef } from '../../models';
import {
  COL_REORDER_START,
  COL_REORDER_DRAG_OVER,
  COL_REORDER_DRAG_ENTER,
  COL_REORDER_STOP,
} from '../../constants/eventsConstants';

export interface CursorCoordinates {
  x: number;
  y: number;
}

const cssDnDClasses = {
  columnsHeaderDropZone: 'MuiDataGrid-colCell-dropZone',
  colCellDragging: 'MuiDataGrid-colCell-dragging',
};

const EVENT_DRAGEND = 'dragend';

const reorderColDefArray = (
  columns: ColDef[],
  newColIndex: number,
  oldColIndex: number,
): ColDef[] => {
  const columnsClone = JSON.parse(JSON.stringify(columns));

  columnsClone.splice(newColIndex, 0, columnsClone.splice(oldColIndex, 1)[0]);

  return columnsClone;
};

const didCursorPositionChanged = (
  currentCoordinates: CursorCoordinates,
  nextCoordinates: CursorCoordinates,
): boolean =>
  currentCoordinates.x !== nextCoordinates.x || currentCoordinates.y !== nextCoordinates.y;

export const useColumnReorder = (columnsRef: React.RefObject<HTMLDivElement>, apiRef: ApiRef) => {
  const logger = useLogger('useColumnReorder');

  const dragCol = React.useRef<ColDef | null>();
  const dragColNode = React.useRef<HTMLElement | null>();
  const cursorPosition = React.useRef<CursorCoordinates>({
    x: 0,
    y: 0,
  });
  const removeDnDStylesTimeout = React.useRef<NodeJS.Timeout | number>();

  const handleDragEnd = React.useCallback((): void => {
    logger.debug(`End dragging col ${dragCol.current!.field}`);
    apiRef.current.publishEvent(COL_REORDER_STOP);

    columnsRef.current?.classList.remove(cssDnDClasses.columnsHeaderDropZone);
    dragColNode.current?.removeEventListener(EVENT_DRAGEND, handleDragEnd);
    dragCol.current = null;
    dragColNode.current = null;
  }, [columnsRef, apiRef, logger]);

  const handleDragOver = React.useCallback(
    (event) => {
      event.preventDefault();
      logger.debug(`Dragging over col ${event.target}`);
      apiRef.current.publishEvent(COL_REORDER_DRAG_OVER);

      columnsRef.current?.classList.add(cssDnDClasses.columnsHeaderDropZone);
    },
    [columnsRef, apiRef, logger],
  );

  const handleDragStart = React.useCallback(
    (col: ColDef, htmlEl: HTMLElement): void => {
      logger.debug(`Start dragging col ${col.field}`);
      apiRef.current.publishEvent(COL_REORDER_START);

      dragCol.current = col;
      dragColNode.current = htmlEl;
      dragColNode.current?.addEventListener(EVENT_DRAGEND, handleDragEnd, { once: true });
      dragColNode.current?.classList.add(cssDnDClasses.colCellDragging);
      removeDnDStylesTimeout.current = setTimeout(() => {
        dragColNode.current?.classList.remove(cssDnDClasses.colCellDragging);
      }, 0);
    },
    [apiRef, handleDragEnd, logger],
  );

  const handleDragEnter = React.useCallback(
    (col: ColDef, coordinates: CursorCoordinates): void => {
      logger.debug(`Enter dragging col ${col.field}`);
      apiRef.current.publishEvent(COL_REORDER_DRAG_ENTER);

      clearTimeout(removeDnDStylesTimeout.current as NodeJS.Timeout);

      if (
        col.field !== dragCol.current!.field &&
        didCursorPositionChanged(cursorPosition.current, coordinates)
      ) {
        cursorPosition.current = coordinates;
        const targetColIndex = apiRef.current.getColumnIndex(col.field);
        const dragColIndex = apiRef.current.getColumnIndex(dragCol.current!.field);
        const columnsSnapshot = apiRef.current.getAllColumns();
        const columnsReordered = reorderColDefArray(columnsSnapshot, targetColIndex, dragColIndex);

        apiRef.current.updateColumns(columnsReordered, true);
      }
    },
    [apiRef, logger],
  );

  return {
    handleDragOver,
    handleDragStart,
    handleDragEnter,
  };
};
