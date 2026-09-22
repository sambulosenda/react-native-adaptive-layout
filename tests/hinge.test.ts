import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { HingeStoreContext } from '../src/hinge/context';
import { toHingeState, UNAVAILABLE_HINGE } from '../src/hinge/state';
import { createHingeStore } from '../src/hinge/store';
import { useHinge } from '../src/hinge/useHinge';
import { useHingeSelector } from '../src/hinge/useHingeSelector';
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

  it('degrades unknown postures safely', () => {
    expect(toHingeState({ available: true, angle: 1, posture: 'tented' }).posture).toBe('unknown');
  });

  it('reports an unreadable angle as unavailable', () => {
    expect(toHingeState({ available: true, angle: Number.NaN, posture: 'closed' })).toBe(
      UNAVAILABLE_HINGE,
    );
    expect(toHingeState({ available: true, angle: Infinity, posture: 'closed' })).toBe(
      UNAVAILABLE_HINGE,
    );
  });

  it('narrows angles through available (checked by tsc)', () => {
    const hinge: HingeState = toHingeState({ available: true, angle: 1, posture: 'closed' });
    if (hinge.available) {
      expectTypeOf(hinge.angleDegrees).toEqualTypeOf<number>();
      expectTypeOf(hinge.angleRadians).toEqualTypeOf<number>();
    } else {
      expectTypeOf(hinge.angleDegrees).toEqualTypeOf<null>();
      expectTypeOf(hinge.posture).toEqualTypeOf<'unknown'>();
    }
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

describe('useHingeSelector', () => {
  const at = (degrees: number, posture: string) =>
    toHingeState({ available: true, angle: (degrees * Math.PI) / 180, posture });

  function mount<T>(
    store: ReturnType<typeof createHingeStore>,
    select: (hinge: HingeState) => T,
    isEqual?: (a: T, b: T) => boolean,
  ) {
    const renders: T[] = [];
    function Probe() {
      const value = useHingeSelector(select, isEqual);
      renders.push(value);
      return null;
    }
    let root!: ReactTestRenderer;
    act(() => {
      root = create(
        createElement(HingeStoreContext.Provider, { value: store }, createElement(Probe)),
      );
    });
    return { renders, root };
  }

  it('throws outside a FoldableLayout', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Probe() {
      useHingeSelector((hinge) => hinge.posture);
      return null;
    }
    expect(() => {
      act(() => {
        create(createElement(Probe));
      });
    }).toThrow(/useHingeSelector must be called inside a FoldableLayout/);
    error.mockRestore();
  });

  it('re-renders only when the selected value changes', () => {
    const store = createHingeStore(at(90, 'partiallyOpen'));
    const { renders, root } = mount(store, (hinge) => hinge.posture);
    expect(renders).toEqual(['partiallyOpen']);

    act(() => store.publish(at(95, 'partiallyOpen')));
    act(() => store.publish(at(100, 'partiallyOpen')));
    expect(renders).toEqual(['partiallyOpen']);

    act(() => store.publish(at(180, 'fullyOpen')));
    expect(renders).toEqual(['partiallyOpen', 'fullyOpen']);
    act(() => root.unmount());
  });

  it('keeps an equal object selection stable with a custom comparison', () => {
    const store = createHingeStore(at(90, 'partiallyOpen'));
    const { renders, root } = mount(
      store,
      (hinge) => ({ open: hinge.posture !== 'closed' }),
      (a, b) => a.open === b.open,
    );
    act(() => store.publish(at(120, 'partiallyOpen')));
    act(() => store.publish(at(180, 'fullyOpen')));
    expect(renders).toHaveLength(1);

    act(() => store.publish(at(0, 'closed')));
    expect(renders.map((value) => value.open)).toEqual([true, false]);
    act(() => root.unmount());
  });
});
