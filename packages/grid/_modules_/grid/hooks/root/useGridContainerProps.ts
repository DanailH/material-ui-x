import * as React from 'react';
import { GRID_RESIZE } from '../../constants/eventsConstants';
import { GridApiRef } from '../../models/api/gridApiRef';
import {
  GridContainerProps,
  GridScrollBarState,
  GridViewportSizeState,
} from '../../models/gridContainerProps';
import { ElementSize } from '../../models/elementSize';
import { isDeepEqual } from '../../utils/utils';
import { gridColumnsTotalWidthSelector } from '../features/columns/gridColumnsSelector';
import { GridState } from '../features/core/gridState';
import { useGridSelector } from '../features/core/useGridSelector';
import { useGridState } from '../features/core/useGridState';
import { gridDensityRowHeightSelector } from '../features/density/densitySelector';
import { visibleGridRowCountSelector } from '../features/filter/gridFilterSelector';
import { PaginationState } from '../features/pagination/gridPaginationReducer';
import { gridPaginationSelector } from '../features/pagination/gridPaginationSelector';
import { optionsSelector } from '../utils/optionsSelector';
import { useLogger } from '../utils/useLogger';
import { useGridApiEventHandler } from './useGridApiEventHandler';

export const useGridContainerProps = (
  windowRef: React.RefObject<HTMLDivElement>,
  apiRef: GridApiRef,
) => {
  const logger = useLogger('useGridContainerProps');
  const [gridState, setGridState, forceUpdate] = useGridState(apiRef);
  const windowSizesRef = React.useRef<ElementSize>({ width: 0, height: 0 });
  const options = useGridSelector(apiRef, optionsSelector);
  const rowHeight = useGridSelector(apiRef, gridDensityRowHeightSelector);
  const columnsTotalWidth = useGridSelector(apiRef, gridColumnsTotalWidthSelector);
  const visibleRowsCount = useGridSelector(apiRef, visibleGridRowCountSelector);
  const paginationState = useGridSelector<PaginationState>(apiRef, gridPaginationSelector);

  const getVirtualRowCount = React.useCallback(() => {
    logger.debug('Calculating virtual row count.');
    const currentPage = paginationState.page;
    let pageRowCount =
      options.pagination && paginationState.pageSize ? paginationState.pageSize : null;

    pageRowCount =
      !pageRowCount || currentPage * pageRowCount <= visibleRowsCount
        ? pageRowCount
        : visibleRowsCount - (currentPage - 1) * pageRowCount;

    const virtRowsCount =
      pageRowCount == null || pageRowCount > visibleRowsCount ? visibleRowsCount : pageRowCount;

    return virtRowsCount;
  }, [
    logger,
    options.pagination,
    paginationState.page,
    paginationState.pageSize,
    visibleRowsCount,
  ]);

  const getScrollBar = React.useCallback(
    (rowsCount: number) => {
      logger.debug('Calculating scrollbar sizes.');
      const hasScrollY =
        options.autoPageSize || options.autoHeight
          ? false
          : windowSizesRef.current.height < rowsCount * rowHeight;
      const hasScrollX = columnsTotalWidth > windowSizesRef.current.width;
      const scrollBarSize = {
        y: hasScrollY ? options.scrollbarSize! : 0,
        x: hasScrollX ? options.scrollbarSize! : 0,
      };
      return { hasScrollX, hasScrollY, scrollBarSize };
    },
    [
      logger,
      options.autoPageSize,
      options.autoHeight,
      options.scrollbarSize,
      rowHeight,
      columnsTotalWidth,
    ],
  );

  const getViewport = React.useCallback(
    (rowsCount: number, scrollBarState: GridScrollBarState) => {
      if (!windowRef.current) {
        return null;
      }

      logger.debug('Calculating container sizes.');

      const window = windowRef.current.getBoundingClientRect();
      windowSizesRef.current = { width: window.width, height: window.height };

      logger.debug(
        `window Size - W: ${windowSizesRef.current.width} H: ${windowSizesRef.current.height} `,
      );

      const viewportSize = {
        width: windowSizesRef.current!.width - scrollBarState.scrollBarSize.y,
        height: options.autoHeight
          ? rowsCount * rowHeight
          : windowSizesRef.current!.height - scrollBarState.scrollBarSize.x,
      };
      return viewportSize;
    },
    [logger, options.autoHeight, rowHeight, windowRef],
  );

  const getContainerProps = React.useCallback(
    (
      rowsCount: number,
      viewportSizes: GridViewportSizeState,
      scrollState: GridScrollBarState,
    ): GridContainerProps | null => {
      if (
        !windowRef ||
        !windowRef.current ||
        columnsTotalWidth === 0 ||
        Number.isNaN(columnsTotalWidth)
      ) {
        return null;
      }

      if (options.autoPageSize || options.autoHeight) {
        // we don't need vertical virtualization in these 2 cases.
        const viewportPageSize = options.autoHeight
          ? rowsCount
          : Math.floor(viewportSizes.height / rowHeight);
        const requiredHeight = viewportPageSize * rowHeight + scrollState.scrollBarSize.x;

        const indexes: GridContainerProps = {
          virtualRowsCount: viewportPageSize,
          renderingZonePageSize: viewportPageSize,
          viewportPageSize,
          totalSizes: {
            width: columnsTotalWidth,
            height: requiredHeight,
          },
          dataContainerSizes: {
            width: columnsTotalWidth,
            height: requiredHeight,
          },
          renderingZone: {
            width: columnsTotalWidth,
            height: requiredHeight,
          },
          windowSizes: windowSizesRef.current,
          lastPage: 1,
        };
        logger.debug('Fixed container props', indexes);
        return indexes;
      }

      const viewportPageSize = Math.round(viewportSizes.height / rowHeight);

      // Number of pages required to render the full set of rows in the viewport
      const viewportMaxPage = Math.ceil(rowsCount / viewportPageSize);

      // TODO allow buffer with fixed nb rows
      // Number of rows rendered in the rendering zone.
      // We multiply by 2 for virtualization to work with useGridVirtualRows scroll system
      const rzPageSize = viewportPageSize * 2;
      const renderingZoneHeight = rzPageSize * rowHeight;

      let totalHeight = (rowsCount / viewportPageSize) * viewportSizes.height;
      // make sure we display the full row
      totalHeight += (totalHeight % rowHeight) + scrollState.scrollBarSize.x;

      const indexes: GridContainerProps = {
        virtualRowsCount: rowsCount,
        renderingZonePageSize: rzPageSize,
        viewportPageSize,
        totalSizes: {
          width: columnsTotalWidth,
          height: totalHeight || 1,
        },
        dataContainerSizes: {
          width: columnsTotalWidth - scrollState.scrollBarSize.y,
          height: totalHeight || 1,
        },
        renderingZone: {
          width: columnsTotalWidth - scrollState.scrollBarSize.y,
          height: renderingZoneHeight,
        },
        windowSizes: windowSizesRef.current,
        lastPage: viewportMaxPage,
      };

      logger.debug('virtualized container props', indexes);
      return indexes;
    },
    [windowRef, columnsTotalWidth, rowHeight, options.autoPageSize, options.autoHeight, logger],
  );

  const updateStateIfChanged = React.useCallback(
    (
      shouldUpdate: (oldState: GridState) => boolean,
      newStateUpdate: (state: GridState) => GridState,
    ) => {
      let update = false;
      setGridState((state) => {
        update = shouldUpdate(state);
        if (update) {
          return newStateUpdate(state);
        }
        return state;
      });
      if (update) {
        forceUpdate();
      }
    },
    [forceUpdate, setGridState],
  );

  const refreshContainerSizes = React.useCallback(() => {
    logger.debug('Refreshing container sizes');
    const rowsCount = getVirtualRowCount();
    const scrollBar = getScrollBar(rowsCount);

    const viewportSizes = getViewport(rowsCount, scrollBar);
    if (!viewportSizes) {
      return;
    }

    updateStateIfChanged(
      (state) => state.scrollBar !== scrollBar,
      (state) => ({ ...state, scrollBar }),
    );

    updateStateIfChanged(
      (state) => state.viewportSizes !== viewportSizes,
      (state) => ({ ...state, viewportSizes }),
    );

    const containerState = getContainerProps(rowsCount, viewportSizes, scrollBar);
    updateStateIfChanged(
      (state) => !isDeepEqual(state.containerSizes, containerState),
      (state) => ({ ...state, containerSizes: containerState }),
    );
  }, [
    getContainerProps,
    getScrollBar,
    getViewport,
    getVirtualRowCount,
    logger,
    updateStateIfChanged,
  ]);

  React.useEffect(() => {
    refreshContainerSizes();
  }, [gridState.columns, gridState.options.hideFooter, refreshContainerSizes, visibleRowsCount]);

  useGridApiEventHandler(apiRef, GRID_RESIZE, refreshContainerSizes);
};
