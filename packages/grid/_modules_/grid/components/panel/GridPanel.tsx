import * as React from 'react';
import { makeStyles, Theme } from '@material-ui/core/styles';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import { GridApiContext } from '../GridApiContext';
import { useGridStripBaseComponentsProps } from '../../hooks/utils/useGridStripBaseComponentsProps';
import { isEscapeKey, isMuiV5 } from '../../utils';

export interface GridPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  open: boolean;
}

const useStyles = makeStyles(
  (theme: Theme) => ({
    root: {
      zIndex: theme.zIndex.modal,
    },
    paper: {
      backgroundColor: theme.palette.background.paper,
      minWidth: 300,
      maxHeight: 450,
      display: 'flex',
    },
  }),
  { name: 'MuiDataGridPanel' },
);

export const GridPanel = React.forwardRef<HTMLDivElement, GridPanelProps>(function GridPanel(
  props,
  ref,
) {
  const { children, open, ...other } = props;
  const strippedProps = useGridStripBaseComponentsProps(other);
  const classes = useStyles();
  const apiRef = React.useContext(GridApiContext);

  const getPopperModifiers = (): any => {
    if (isMuiV5()) {
      return [
        {
          name: 'flip',
          enabled: false,
        },
      ];
    }

    return {
      flip: {
        enabled: false,
      },
    };
  };

  const handleClickAway = React.useCallback(() => {
    apiRef!.current.hidePreferences();
  }, [apiRef]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (isEscapeKey(event.key)) {
        apiRef!.current.hidePreferences();
      }
    },
    [apiRef],
  );

  let anchorEl;
  if (apiRef!.current && apiRef!.current.columnHeadersElementRef?.current) {
    anchorEl = apiRef?.current.columnHeadersElementRef?.current;
  }

  if (!anchorEl) {
    return null;
  }

  return (
    <Popper
      ref={ref}
      placement="bottom-start"
      className={classes.root}
      open={open}
      anchorEl={anchorEl}
      modifiers={getPopperModifiers()}
      {...strippedProps}
    >
      <ClickAwayListener onClickAway={handleClickAway}>
        <Paper className={classes.paper} elevation={8} onKeyDown={handleKeyDown}>
          {children}
        </Paper>
      </ClickAwayListener>
    </Popper>
  );
});
