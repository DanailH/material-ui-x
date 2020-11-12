import * as React from 'react';
import { useApiRef, ApiContext } from '../../_modules_/grid';

export const GridProvider = React.memo(function GridProvider({ children }) {
  const apiRef = useApiRef();
  console.log(apiRef)
  return (
    <ApiContext.Provider value={apiRef}>
      {children}
    </ApiContext.Provider>
  );
});