import * as React from 'react';
import clsx from 'clsx';
import { useForkRef } from '@mui/material/utils';
import NoSsr from '@mui/material/NoSsr';
import { GridRootContainerRef } from '../../models/gridRootContainerRef';
import { GridRootStyles } from './GridRootStyles';
import { visibleGridColumnsLengthSelector } from '../../hooks/features/columns/gridColumnsSelector';
import { useGridSelector } from '../../hooks/features/core/useGridSelector';
import { useGridApiContext } from '../../hooks/root/useGridApiContext';
import { useGridRootProps } from '../../hooks/utils/useGridRootProps';
import { gridClasses } from '../../gridClasses';
import { gridRowCountSelector } from '../../hooks/features/rows/gridRowsSelector';

export type GridRootProps = React.HTMLAttributes<HTMLDivElement>;

export const GridRoot = React.forwardRef<HTMLDivElement, GridRootProps>(function GridRoot(
  props,
  ref,
) {
  const rootProps = useGridRootProps();
  const { children, className, ...other } = props;
  const apiRef = useGridApiContext();
  const visibleColumnsLength = useGridSelector(apiRef, visibleGridColumnsLengthSelector);
  const totalRowCount = useGridSelector(apiRef, gridRowCountSelector);
  const rootContainerRef: GridRootContainerRef = React.useRef<HTMLDivElement>(null);
  const handleRef = useForkRef(rootContainerRef, ref);

  apiRef.current.rootElementRef = rootContainerRef;

  return (
    <NoSsr>
      <GridRootStyles
        ref={handleRef}
        className={clsx(className, rootProps.classes?.root, rootProps.className, gridClasses.root, {
          [gridClasses.autoHeight]: rootProps.autoHeight,
        })}
        role="grid"
        aria-colcount={visibleColumnsLength}
        aria-rowcount={totalRowCount}
        aria-multiselectable={!rootProps.disableMultipleSelection}
        aria-label={rootProps['aria-label']}
        aria-labelledby={rootProps['aria-labelledby']}
        style={rootProps.style}
        {...other}
      >
        {children}
      </GridRootStyles>
    </NoSsr>
  );
});
