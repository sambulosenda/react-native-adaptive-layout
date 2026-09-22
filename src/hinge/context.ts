import { createContext, useContext } from 'react';
import type { HingeStore } from './store';

export const HingeStoreContext = createContext<HingeStore | null>(null);

/** Reads the nearest layout's store, throwing with the calling hook's name outside a pane. */
export function useHingeStore(hook: string): HingeStore {
  const store = useContext(HingeStoreContext);
  if (!store) {
    throw new Error(
      `${hook} must be called inside a FoldableLayout.Primary or FoldableLayout.Secondary subtree.`,
    );
  }
  return store;
}
