import { createStore, type Store } from '../store';
import type { Arrangement } from '../types';
import { isSameArrangement, UNRESOLVED_ARRANGEMENT } from './state';

export type ArrangementStore = Store<Arrangement>;

export function createArrangementStore(
  initial: Arrangement = UNRESOLVED_ARRANGEMENT,
): ArrangementStore {
  return createStore(initial, isSameArrangement);
}
