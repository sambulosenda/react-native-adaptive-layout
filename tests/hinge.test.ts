import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { HingeStoreContext } from '../src/hinge/context';
import { toHingeState, UNAVAILABLE_HINGE } from '../src/hinge/state';
import { createHingeStore } from '../src/hinge/store';
import { useHinge } from '../src/hinge/useHinge';
import type { HingeState } from '../src/types';
import './setup';

describe('toHingeState', () => {
  it('treats missing hardware as unavailable regardless of other fields', () => {
    expect(toHingeState({ available: false, angle: Math.PI, posture: 'fullyOpen' })).toBe(
      UNAVAILABLE_HINGE,
    );
  });

  it('preserves radians and derives degrees', () => {
    const state = toHingeState({ available: true, angle: Math.PI / 2, posture: 'partiallyOpen' });
    expect(state.angleRadians).toBe(Math.PI / 2);
    expect(state.angleDegrees).toBeCloseTo(90);
    expect(state.posture).toBe('partiallyOpen');
  });

  it('degrades unknown postures and non-finite angles safely', () => {
    expect(toHingeState({ available: true, angle: 1, posture: 'tented' }).posture).toBe('unknown');
    const nan = toHingeState({ available: true, angle: Number.NaN, posture: 'closed' });
    expect(nan.angleRadians).toBeNull();
    expect(nan.angleDegrees).toBeNull();
  });

  it('never infers posture from the angle', () => {
    expect(toHingeState({ available: true, angle: 0.05, posture: 'fullyOpen' }).posture).toBe(
      'fullyOpen',
    );
  });
});

describe('createHingeStore', () => {
  const open = toHingeState({ available: true, angle: Math.PI, posture: 'fullyOpen' });

  it('notifies subscribers only on meaningful change', () => {
    const store = createHingeStore();
    let notifications = 0;
    store.subscribe(() => notifications++);
    store.publish(open);
    store.publish({ ...open });
    expect(notifications).toBe(1);
    expect(store.getSnapshot()).toEqual(open);
  });

  it('isolates independent stores and honours unsubscribe', () => {
    const a = createHingeStore();
    const b = createHingeStore();
    let notifications = 0;
    const unsubscribe = a.subscribe(() => notifications++);
    a.publish(open);
    expect(b.getSnapshot()).toBe(UNAVAILABLE_HINGE);
    unsubscribe();
    a.publish(UNAVAILABLE_HINGE);
    expect(notifications).toBe(1);
  });
});

describe('useHinge', () => {
  function Probe({ listener }: { listener: (hinge: HingeState) => void }) {
    const hinge = useHinge(listener);
    return createElement('span', null, hinge.posture);
  }

  it('throws outside a FoldableLayout', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      act(() => {
        create(createElement(Probe, { listener: () => {} }));
      });
    }).toThrow(/inside a FoldableLayout/);
    error.mockRestore();
  });

  it('delivers the initial state, follows changes and uses the latest listener', async () => {
    const store = createHingeStore();
    const first: HingeState[] = [];
    const second: HingeState[] = [];
    const tree = (listener: (hinge: HingeState) => void) =>
      createElement(
        HingeStoreContext.Provider,
        { value: store },
        createElement(Probe, { listener }),
      );

    let root!: ReactTestRenderer;
    await act(() => {
      root = create(tree((hinge) => first.push(hinge)));
    });
    expect(first).toEqual([UNAVAILABLE_HINGE]);

    await act(() => {
      root.update(tree((hinge) => second.push(hinge)));
    });
    const open = toHingeState({ available: true, angle: Math.PI, posture: 'fullyOpen' });
    await act(() => {
      store.publish(open);
    });
    expect(first).toEqual([UNAVAILABLE_HINGE]);
    expect(second).toEqual([open]);
    expect(root.toJSON()).toMatchObject({ children: ['fullyOpen'] });

    await act(() => {
      root.unmount();
    });
    await act(() => {
      store.publish(UNAVAILABLE_HINGE);
    });
    expect(second).toHaveLength(1);
  });
});
