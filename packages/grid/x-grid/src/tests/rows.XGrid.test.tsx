import * as React from 'react';
import {
  createClientRenderStrictMode,
  // @ts-expect-error need to migrate helpers to TypeScript
  fireEvent,
} from 'test/utils';
import { useFakeTimers, spy } from 'sinon';
import { expect } from 'chai';
import { getCell, getColumnHeaderCell, getColumnValues } from 'test/utils/helperFn';
import {
  GridApiRef,
  GridComponentProps,
  GridRowData,
  GRID_SKELETON_CELL_CSS_CLASS,
  useGridApiRef,
  XGrid,
  XGridProps,
} from '@material-ui/x-grid';
import { useData } from 'packages/storybook/src/hooks/useData';

const isJSDOM = /jsdom/.test(window.navigator.userAgent);

describe('<XGrid /> - Rows', () => {
  let clock;
  let baselineProps;

  // TODO v5: replace with createClientRender
  const render = createClientRenderStrictMode();

  describe('getRowId', () => {
    beforeEach(() => {
      clock = useFakeTimers();

      baselineProps = {
        autoHeight: isJSDOM,
        rows: [
          {
            clientId: 'c1',
            first: 'Mike',
            age: 11,
          },
          {
            clientId: 'c2',
            first: 'Jack',
            age: 11,
          },
          {
            clientId: 'c3',
            first: 'Mike',
            age: 20,
          },
        ],
        columns: [{ field: 'clientId' }, { field: 'first' }, { field: 'age' }],
      };
    });

    afterEach(() => {
      clock.restore();
    });

    describe('updateRows', () => {
      it('should apply getRowId before updating rows', () => {
        const getRowId = (row) => `${row.clientId}`;
        let apiRef: GridApiRef;
        const Test = () => {
          apiRef = useGridApiRef();
          return (
            <div style={{ width: 300, height: 300 }}>
              <XGrid {...baselineProps} getRowId={getRowId} apiRef={apiRef} />
            </div>
          );
        };
        render(<Test />);
        expect(getColumnValues()).to.deep.equal(['c1', 'c2', 'c3']);
        apiRef!.current.updateRows([
          { clientId: 'c2', age: 30 },
          { clientId: 'c3', age: 31 },
        ]);
        clock.tick(100);

        expect(getColumnValues(2)).to.deep.equal(['11', '30', '31']);
      });
    });

    it('should allow to switch between cell mode', () => {
      let apiRef: GridApiRef;
      const editableProps = { ...baselineProps };
      editableProps.columns = editableProps.columns.map((col) => ({ ...col, editable: true }));
      const getRowId = (row) => `${row.clientId}`;

      const Test = () => {
        apiRef = useGridApiRef();
        return (
          <div style={{ width: 300, height: 300 }}>
            <XGrid {...editableProps} apiRef={apiRef} getRowId={getRowId} />
          </div>
        );
      };
      render(<Test />);
      apiRef!.current.setCellMode('c2', 'first', 'edit');
      const cell = getCell(1, 1);

      expect(cell).to.have.class('MuiDataGrid-cellEditable');
      expect(cell).to.have.class('MuiDataGrid-cellEditing');
      expect(cell.querySelector('input')!.value).to.equal('Jack');
      apiRef!.current.setCellMode('c2', 'first', 'view');

      expect(cell).to.have.class('MuiDataGrid-cellEditable');
      expect(cell).not.to.have.class('MuiDataGrid-cellEditing');
      expect(cell.querySelector('input')).to.equal(null);
    });

    it('should not clone the row', () => {
      const getRowId = (row) => `${row.clientId}`;
      let apiRef: GridApiRef;
      const Test = () => {
        apiRef = useGridApiRef();
        return (
          <div style={{ width: 300, height: 300 }}>
            <XGrid {...baselineProps} getRowId={getRowId} apiRef={apiRef} />
          </div>
        );
      };
      render(<Test />);
      expect(apiRef!.current.getRow('c1')).to.equal(baselineProps.rows[0]);
    });
  });

  describe('updateRows', () => {
    beforeEach(() => {
      clock = useFakeTimers();

      baselineProps = {
        autoHeight: isJSDOM,
        rows: [
          {
            id: 0,
            brand: 'Nike',
          },
          {
            id: 1,
            brand: 'Adidas',
          },
          {
            id: 2,
            brand: 'Puma',
          },
        ],
        columns: [{ field: 'brand', headerName: 'Brand' }],
      };
    });

    afterEach(() => {
      clock.restore();
    });

    let apiRef: GridApiRef;

    const TestCase = (props: Partial<GridComponentProps>) => {
      apiRef = useGridApiRef();
      return (
        <div style={{ width: 300, height: 300 }}>
          <XGrid {...baselineProps} apiRef={apiRef} {...props} />
        </div>
      );
    };

    it('should allow to reset rows with setRows and render after 100ms', () => {
      render(<TestCase />);
      const newRows = [
        {
          id: 3,
          brand: 'Asics',
        },
      ];
      apiRef.current.setRows(newRows);

      clock.tick(50);
      expect(getColumnValues()).to.deep.equal(['Nike', 'Adidas', 'Puma']);
      clock.tick(50);
      expect(getColumnValues()).to.deep.equal(['Asics']);
    });

    it('should allow to update row data', () => {
      render(<TestCase />);
      apiRef.current.updateRows([{ id: 1, brand: 'Fila' }]);
      apiRef.current.updateRows([{ id: 0, brand: 'Pata' }]);
      apiRef.current.updateRows([{ id: 2, brand: 'Pum' }]);
      clock.tick(100);
      expect(getColumnValues()).to.deep.equal(['Pata', 'Fila', 'Pum']);
    });

    it('update row data can also add rows', () => {
      render(<TestCase />);
      apiRef.current.updateRows([{ id: 1, brand: 'Fila' }]);
      apiRef.current.updateRows([{ id: 0, brand: 'Pata' }]);
      apiRef.current.updateRows([{ id: 2, brand: 'Pum' }]);
      apiRef.current.updateRows([{ id: 3, brand: 'Jordan' }]);
      clock.tick(100);
      expect(getColumnValues()).to.deep.equal(['Pata', 'Fila', 'Pum', 'Jordan']);
    });

    it('update row data can also add rows in bulk', () => {
      render(<TestCase />);
      apiRef.current.updateRows([
        { id: 1, brand: 'Fila' },
        { id: 0, brand: 'Pata' },
        { id: 2, brand: 'Pum' },
        { id: 3, brand: 'Jordan' },
      ]);
      clock.tick(100);
      expect(getColumnValues()).to.deep.equal(['Pata', 'Fila', 'Pum', 'Jordan']);
    });

    it('update row data can also delete rows', () => {
      render(<TestCase />);
      apiRef.current.updateRows([{ id: 1, _action: 'delete' }]);
      apiRef.current.updateRows([{ id: 0, brand: 'Apple' }]);
      apiRef.current.updateRows([{ id: 2, _action: 'delete' }]);
      apiRef.current.updateRows([{ id: 5, brand: 'Atari' }]);
      clock.tick(100);
      expect(getColumnValues()).to.deep.equal(['Apple', 'Atari']);
    });

    it('update row data can also delete rows in bulk', () => {
      render(<TestCase />);
      apiRef.current.updateRows([
        { id: 1, _action: 'delete' },
        { id: 0, brand: 'Apple' },
        { id: 2, _action: 'delete' },
        { id: 5, brand: 'Atari' },
      ]);
      clock.tick(100);
      expect(getColumnValues()).to.deep.equal(['Apple', 'Atari']);
    });

    it('update row data should process getRowId', () => {
      const TestCaseGetRowId = () => {
        apiRef = useGridApiRef();
        const getRowId = React.useCallback((row: GridRowData) => row.idField, []);
        return (
          <div style={{ width: 300, height: 300 }}>
            <XGrid
              {...baselineProps}
              apiRef={apiRef}
              rows={baselineProps.rows.map((row) => ({ idField: row.id, brand: row.brand }))}
              getRowId={getRowId}
            />
          </div>
        );
      };

      render(<TestCaseGetRowId />);
      expect(getColumnValues()).to.deep.equal(['Nike', 'Adidas', 'Puma']);
      apiRef.current.updateRows([
        { idField: 1, _action: 'delete' },
        { idField: 0, brand: 'Apple' },
        { idField: 2, _action: 'delete' },
        { idField: 5, brand: 'Atari' },
      ]);
      clock.tick(100);
      expect(getColumnValues()).to.deep.equal(['Apple', 'Atari']);
    });
  });

  describe('virtualization', () => {
    before(function beforeHook() {
      if (isJSDOM) {
        // Need layouting
        this.skip();
      }
    });

    let apiRef: GridApiRef;
    const TestCaseVirtualization = (
      props: Partial<XGridProps> & { nbRows?: number; nbCols?: number; height?: number },
    ) => {
      apiRef = useGridApiRef();
      const data = useData(props.nbRows || 100, props.nbCols || 10);

      return (
        <div style={{ width: 300, height: props.height || 300 }}>
          <XGrid apiRef={apiRef} columns={data.columns} rows={data.rows} {...props} />
        </div>
      );
    };

    it('Rows should not be virtualized when the number of rows fit in the viewport', () => {
      const headerHeight = 50;
      const rowHeight = 50;
      const maxRowsNotVirtualised = (300 - headerHeight) / rowHeight;
      render(
        <TestCaseVirtualization
          nbRows={maxRowsNotVirtualised}
          hideFooter
          headerHeight={headerHeight}
          rowHeight={rowHeight}
        />,
      );

      const isVirtualized = apiRef!.current!.getState().containerSizes!.isVirtualized;
      expect(isVirtualized).to.equal(false);
    });

    it('Rows should be virtualized when at least 2 rows are outside the viewport', () => {
      const headerHeight = 50;
      const rowHeight = 50;
      const maxRowsNotVirtualised = (300 - headerHeight) / rowHeight;
      render(
        <TestCaseVirtualization
          nbRows={maxRowsNotVirtualised + 1}
          hideFooter
          headerHeight={headerHeight}
          rowHeight={rowHeight}
        />,
      );

      let isVirtualized = apiRef!.current!.getState().containerSizes!.isVirtualized;
      expect(isVirtualized).to.equal(false);

      render(
        <TestCaseVirtualization
          nbRows={maxRowsNotVirtualised + 2}
          hideFooter
          headerHeight={headerHeight}
          rowHeight={rowHeight}
        />,
      );

      isVirtualized = apiRef!.current!.getState().containerSizes!.isVirtualized;
      expect(isVirtualized).to.equal(true);
    });

    it('should render last row when scrolling to the bottom', () => {
      render(<TestCaseVirtualization nbRows={996} hideFooter height={600} />);
      const totalHeight = apiRef!.current!.getState().containerSizes?.totalSizes.height!;

      const gridWindow = document.querySelector('.MuiDataGrid-window')!;
      const renderingZone = document.querySelector('.MuiDataGrid-renderingZone')! as HTMLElement;
      gridWindow.scrollTop = 10e6; // scroll to the bottom
      gridWindow.dispatchEvent(new Event('scroll'));

      const lastCell = document.querySelector('[role="row"]:last-child [role="cell"]:first-child')!;
      expect(lastCell).to.have.text('995');
      expect(renderingZone.children.length).to.equal(16);
      expect(renderingZone.style.transform).to.equal('translate3d(0px, -312px, 0px)');
      expect(gridWindow.scrollHeight).to.equal(totalHeight);
    });

    it('Rows should not be virtualized when the grid is in pagination autoPageSize', () => {
      render(<TestCaseVirtualization autoPageSize pagination />);

      const isVirtualized = apiRef!.current!.getState().containerSizes!.isVirtualized;
      expect(isVirtualized).to.equal(false);
    });

    it('Rows should not be virtualized when the grid is in autoHeight', () => {
      render(<TestCaseVirtualization autoHeight />);

      const isVirtualized = apiRef!.current!.getState().containerSizes!.isVirtualized;
      expect(isVirtualized).to.equal(false);
    });

    it('should set the virtual page to 0 when resetting rows to a non virtualized length', () => {
      const { setProps } = render(<TestCaseVirtualization nbRows={996} hideFooter height={600} />);

      const gridWindow = document.querySelector('.MuiDataGrid-window')!;
      gridWindow.scrollTop = 10e6; // scroll to the bottom
      gridWindow.dispatchEvent(new Event('scroll'));

      let lastCell = document.querySelector('[role="row"]:last-child [role="cell"]:first-child')!;
      expect(lastCell).to.have.text('995');

      let virtualPage = apiRef!.current!.getState().rendering!.virtualPage;
      expect(virtualPage).to.equal(98);

      setProps({ nbRows: 9 });

      lastCell = document.querySelector('[role="row"]:last-child [role="cell"]:first-child')!;
      expect(lastCell).to.have.text('8');

      const renderingZone = document.querySelector('.MuiDataGrid-renderingZone')! as HTMLElement;
      expect(renderingZone.children.length).to.equal(9);

      virtualPage = apiRef!.current!.getState().rendering!.virtualPage;
      expect(virtualPage).to.equal(0);

      const isVirtualized = apiRef!.current!.getState().containerSizes!.isVirtualized;
      expect(isVirtualized).to.equal(false);
    });

    describe('Pagination', () => {
      it('should render only the pageSize', () => {
        render(<TestCaseVirtualization pagination pageSize={32} />);
        const gridWindow = document.querySelector('.MuiDataGrid-window')!;
        gridWindow.scrollTop = 10e6; // scroll to the bottom
        gridWindow.dispatchEvent(new Event('scroll'));

        const lastCell = document.querySelector(
          '[role="row"]:last-child [role="cell"]:first-child',
        )!;
        expect(lastCell).to.have.text('31');
        const totalHeight = apiRef!.current!.getState().containerSizes?.totalSizes.height!;
        expect(gridWindow.scrollHeight).to.equal(totalHeight);
      });

      it('should not virtualized the last page if smaller than viewport', () => {
        render(<TestCaseVirtualization pagination pageSize={32} page={3} height={500} />);
        const gridWindow = document.querySelector('.MuiDataGrid-window')!;
        gridWindow.scrollTop = 10e6; // scroll to the bottom
        gridWindow.dispatchEvent(new Event('scroll'));

        const lastCell = document.querySelector(
          '[role="row"]:last-child [role="cell"]:first-child',
        )!;
        expect(lastCell).to.have.text('99');
        expect(gridWindow.scrollTop).to.equal(0);
        expect(gridWindow.scrollHeight).to.equal(gridWindow.clientHeight);

        const isVirtualized = apiRef!.current!.getState().containerSizes!.isVirtualized;
        expect(isVirtualized).to.equal(false);
        const virtualRowsCount = apiRef!.current!.getState().containerSizes!.virtualRowsCount;
        expect(virtualRowsCount).to.equal(4);
      });

      it('should paginate small dataset in auto page-size #1492', () => {
        render(<TestCaseVirtualization pagination autoPageSize height={496} nbRows={9} />);
        const gridWindow = document.querySelector('.MuiDataGrid-window')!;

        const lastCell = document.querySelector(
          '[role="row"]:last-child [role="cell"]:first-child',
        )!;
        expect(lastCell).to.have.text('6');
        const rows = document.querySelectorAll('.MuiDataGrid-row[role="row"]')!;
        expect(rows.length).to.equal(7);

        expect(gridWindow.scrollTop).to.equal(0);
        expect(gridWindow.scrollHeight).to.equal(gridWindow.clientHeight);

        const isVirtualized = apiRef!.current!.getState().containerSizes!.isVirtualized;
        expect(isVirtualized).to.equal(false);
        const virtualRowsCount = apiRef!.current!.getState().containerSizes!.virtualRowsCount;
        expect(virtualRowsCount).to.equal(7);
      });
    });
  });

  describe('Infinite loader', () => {
    before(function beforeHook() {
      if (isJSDOM) {
        // Need layouting
        this.skip();
      }
    });

    let apiRef: GridApiRef;
    const TestCaseInfiniteLoading = (
      props: Partial<XGridProps> & { nbRows?: number; nbCols?: number; height?: number },
    ) => {
      apiRef = useGridApiRef();
      const data = useData(props.nbRows || 100, props.nbCols || 10);

      return (
        <div style={{ width: 300, height: props.height || 300 }}>
          <XGrid
            apiRef={apiRef}
            hideFooterPagination
            columns={data.columns}
            rows={data.rows}
            {...props}
          />
        </div>
      );
    };

    it('should call onRowsScrollEnd when scroll reaches the bottom of the grid', () => {
      const handleRowsScrollEnd = spy();
      render(<TestCaseInfiniteLoading nbRows={20} onRowsScrollEnd={handleRowsScrollEnd} />);

      const gridWindow = document.querySelector('.MuiDataGrid-window')!;
      gridWindow.scrollTop = 10e6; // scroll to the bottom
      gridWindow.dispatchEvent(new Event('scroll'));

      expect(handleRowsScrollEnd.callCount).to.equal(1);
    });

    it('should call onFetchRows when scroll reaches the bottom of the grid', () => {
      const handleFetchRows = spy();
      render(
        <TestCaseInfiniteLoading
          sortingMode="server"
          filterMode="server"
          nbRows={20}
          rowCount={50}
          onFetchRows={handleFetchRows}
        />,
      );

      const gridWindow = document.querySelector('.MuiDataGrid-window')!;
      gridWindow.scrollTop = 10e6; // scroll to the bottom
      gridWindow.dispatchEvent(new Event('scroll'));

      expect(handleFetchRows.callCount).to.equal(1);
    });

    it('should call onFetchRows when sorting is applied', () => {
      const handleFetchRows = spy();
      render(
        <TestCaseInfiniteLoading
          sortingMode="server"
          filterMode="server"
          nbRows={20}
          rowCount={50}
          onFetchRows={handleFetchRows}
        />,
      );

      fireEvent.click(getColumnHeaderCell(0));
      expect(handleFetchRows.callCount).to.equal(1);
    });

    it('should render skeleton cell if rowCount is bigger than the number of rows', () => {
      render(
        <TestCaseInfiniteLoading
          sortingMode="server"
          filterMode="server"
          nbRows={20}
          rowCount={50}
        />,
      );

      const gridWindow = document.querySelector('.MuiDataGrid-window')!;
      gridWindow.scrollTop = 10e6; // scroll to the bottom
      gridWindow.dispatchEvent(new Event('scroll'));

      const lastCell = document.querySelector('[role="row"]:last-child [role="cell"]:first-child')!;

      expect(lastCell.classList.contains(GRID_SKELETON_CELL_CSS_CLASS)).to.equal(true);
    });

    it('should update allRows accordingly when apiRef.current.insertRows is called', () => {
      render(
        <TestCaseInfiniteLoading
          sortingMode="server"
          filterMode="server"
          nbRows={5}
          nbCols={2}
          rowCount={10}
        />,
      );

      const pageSize = 3;
      const startIndex = 7;
      const endIndex = startIndex + pageSize;
      const newRows: GridRowData[] = [
        { id: 'new-1', currencyPair: '' },
        { id: 'new-2', currencyPair: '' },
        { id: 'new-3', currencyPair: '' },
      ];

      const initialAllRows = apiRef!.current!.getState().rows!.allRows;
      expect(initialAllRows.slice(startIndex, endIndex)).to.deep.equal([null, null, null]);

      apiRef!.current!.insertRows({ startIndex, pageSize, newRows });

      const updatedAllRows = apiRef!.current!.getState().rows!.allRows;
      expect(updatedAllRows.slice(startIndex, endIndex)).to.deep.equal(['new-1', 'new-2', 'new-3']);
    });
  });
});
