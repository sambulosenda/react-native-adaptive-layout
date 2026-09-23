import { createStore, type Store } from '../store';
import type { HingeState } from '../types';
import { isSameHinge, UNAVAILABLE_HINGE } from './state';

export type HingeStore = Store<HingeState>;

export function createHingeStore(initial: HingeState = UNAVAILABLE_HINGE): HingeStore {
  return createStore(initial, isSameHinge);
}
