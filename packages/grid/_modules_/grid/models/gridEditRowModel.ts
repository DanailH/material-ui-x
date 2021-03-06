import { GridCellValue } from './gridCell';

export interface GridEditCellProps {
  value: GridCellValue;
  [prop: string]: any;
}

export type GridEditRowUpdate = { [field: string]: GridEditCellProps };

export type GridEditRowsModel = { [rowId: string]: GridEditRowUpdate };
