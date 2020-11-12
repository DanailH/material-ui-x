import * as React from 'react';
import { ElementSize, XGrid, useApiRef } from '@material-ui/x-grid';
import { GridProvider } from '@material-ui/grid-provider';
import { withKnobs } from '@storybook/addon-knobs';
import { withA11y } from '@storybook/addon-a11y';
import '../style/grid-stories.css';
import { useData } from '../hooks/useData';

export default {
  title: 'X-Grid Tests/Reorder',
  component: XGrid,
  decorators: [withKnobs, withA11y],
  parameters: {
    options: { selectedPanel: 'storybook/storysource/panel' },
    docs: {
      page: null,
    },
  },
};
export const ReorderSmallDataset = () => {
  const size: ElementSize = { width: 800, height: 600 };
  const data = useData(5, 4);
  const apiRef = useApiRef();
  console.log(GridProvider)
  React.useEffect(() => {
    const cols = apiRef.current.getAllColumns();
    console.log(cols)
  });

  return (
    <div style={{ width: size.width, height: size.height, display: 'flex' }}>
      <XGrid rows={data.rows} columns={data.columns} apiRef={apiRef} />
    </div>
  );
};
