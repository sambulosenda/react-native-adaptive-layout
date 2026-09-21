import { createContext } from 'react';
import type { HingeStore } from './store';

export const HingeStoreContext = createContext<HingeStore | null>(null);
