import { createContext, useContext } from 'react';
import type { ArrangementStore } from './store';

export const ArrangementStoreContext = createContext<ArrangementStore | null>(null);

/** Reads the nearest layout's store, throwing with the calling hook's name outside a pane. */
export function useArrangementStore(hook: string): ArrangementStore {
  const store = useContext(ArrangementStoreContext);
  if (!store) {
    throw new Error(
      `${hook} must be called inside a FoldableLayout.Primary or FoldableLayout.Secondary subtree.`,
    );
  }
  return store;
}
