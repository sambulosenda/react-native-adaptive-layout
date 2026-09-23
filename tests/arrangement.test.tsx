import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import {
  classify,
  isSameArrangement,
  type NativeArrangementPayload,
  toArrangement,
  UNRESOLVED_ARRANGEMENT,
} from '../src/arrangement/state';
import { useArrangement, useArrangementSelector } from '../src/arrangement/useArrangement';
import { createArrangement, HingeTestProvider } from '../src/testing';
import type { ArrangementKind } from '../src/types';
import './setup';

const pane = (visible: boolean, x: number, y: number, width: number, height: number) => ({
  visible,
  x,
  y,
  width,
  height,
});

const payload = (
  primary: ReturnType<typeof pane>,
  secondary: ReturnType<typeof pane>,
  size = { width: 833, height: 510 },
): NativeArrangementPayload => ({ ...size, primary, secondary });

// Frames observed on the iPhone Duo simulator (iOS 27.1), layout coordinates.
describe('toArrangement with frames observed on iPhone Duo', () => {
  it('split, fully open: panes touch side by side', () => {
    const a = toArrangement(payload(pane(true, 0, 0, 417, 510), pane(true, 417, 0, 416, 510)));
    expect(a.kind).toBe('sideBySide');
    expect(a.secondary.frame).toEqual({ x: 417, y: 0, width: 416, height: 510 });
  });

  it('split, half open: side by side with a hinge gap', () => {
    const a = toArrangement(payload(pane(true, 0, 0, 439, 510), pane(true, 479, 0, 354, 510)));
    expect(a.kind).toBe('sideBySide');
  });

  it('split, closed with any axis: stacked', () => {
    const a = toArrangement(
      payload(pane(true, 0, 0, 348, 238), pane(true, 0, 238, 348, 238), {
        width: 348,
        height: 477,
      }),
    );
    expect(a.kind).toBe('stacked');
  });

  it('split, closed with horizontal axis: secondary detached with a stale frame', () => {
    const a = toArrangement(
      payload(pane(true, 0, 0, 348, 477), pane(false, 0, 238, 348, 238), {
        width: 348,
        height: 477,
      }),
    );
    expect(a.kind).toBe('single');
    expect(a.secondary).toEqual({ visible: false, frame: null });
  });

  it('overlay, fully open: layered', () => {
    const a = toArrangement(payload(pane(true, 0, 0, 833, 510), pane(true, 0, 0, 833, 510)));
    expect(a.kind).toBe('layered');
  });

  it('overlay, half open, trailing edge: side by side like a split', () => {
    const a = toArrangement(payload(pane(true, 479, 0, 354, 510), pane(true, 0, 0, 439, 510)));
    expect(a.kind).toBe('sideBySide');
  });
});

describe('toArrangement edge cases', () => {
  it('treats a zero-area pane as hidden', () => {
    const a = toArrangement(payload(pane(true, 0, 0, 833, 510), pane(true, 0, 0, 0, 0)));
    expect(a.kind).toBe('single');
    expect(a.secondary.visible).toBe(false);
  });

  it('reports unknown when nothing is visible yet', () => {
    expect(toArrangement(payload(pane(false, 0, 0, 0, 0), pane(false, 0, 0, 0, 0))).kind).toBe(
      'unknown',
    );
  });

  it('compares arrangements by value', () => {
    const make = () =>
      toArrangement(payload(pane(true, 0, 0, 417, 510), pane(true, 417, 0, 416, 510)));
    expect(isSameArrangement(make(), make())).toBe(true);
    const moved = toArrangement(payload(pane(true, 0, 0, 439, 510), pane(true, 479, 0, 354, 510)));
    expect(isSameArrangement(make(), moved)).toBe(false);
  });
});

describe('createArrangement', () => {
  it.each<ArrangementKind>(['single', 'sideBySide', 'stacked', 'layered'])(
    'builds frames that classify as %s',
    (kind) => {
      const a = createArrangement(kind);
      expect(a.kind).toBe(kind);
      expect(classify(a.primary.frame, a.secondary.frame)).toBe(kind);
    },
  );

  it('returns the unresolved arrangement for unknown', () => {
    expect(createArrangement('unknown')).toBe(UNRESOLVED_ARRANGEMENT);
  });
});

describe('useArrangement / useArrangementSelector', () => {
  it('throws outside a FoldableLayout', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Probe() {
      useArrangement();
      return null;
    }
    expect(() => {
      act(() => {
        create(<Probe />);
      });
    }).toThrow(/useArrangement must be called inside a FoldableLayout/);
    error.mockRestore();
  });

  it('follows the provided arrangement, defaulting to unknown', () => {
    function Kind() {
      return <>{useArrangement().kind}</>;
    }
    let root!: ReactTestRenderer;
    act(() => {
      root = create(
        <HingeTestProvider>
          <Kind />
        </HingeTestProvider>,
      );
    });
    expect(root.toJSON()).toBe('unknown');
    act(() => {
      root.update(
        <HingeTestProvider arrangement={createArrangement('sideBySide')}>
          <Kind />
        </HingeTestProvider>,
      );
    });
    expect(root.toJSON()).toBe('sideBySide');
    act(() => root.unmount());
  });

  it('selector re-renders only when the selected value changes', () => {
    const renders: boolean[] = [];
    function SecondaryVisible() {
      renders.push(useArrangementSelector((a) => a.secondary.visible));
      return null;
    }
    const child = <SecondaryVisible />;
    const tree = (kind: ArrangementKind, width: number) => (
      <HingeTestProvider arrangement={createArrangement(kind, { width, height: 500 })}>
        {child}
      </HingeTestProvider>
    );
    let root!: ReactTestRenderer;
    act(() => {
      root = create(tree('sideBySide', 800));
    });
    act(() => root.update(tree('sideBySide', 900)));
    act(() => root.update(tree('stacked', 900)));
    expect(renders).toEqual([true]);
    act(() => root.update(tree('single', 900)));
    expect(renders).toEqual([true, false]);
    act(() => root.unmount());
  });
});
