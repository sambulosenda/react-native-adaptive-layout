import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { describe, expect, it } from 'vitest';
import { UNAVAILABLE_HINGE } from '../src/hinge/state';
import { useHinge } from '../src/hinge/useHinge';
import { useHingeSelector } from '../src/hinge/useHingeSelector';
import { createHingeState, type HingeInput, HingeTestProvider } from '../src/testing';
import './setup';

describe('createHingeState', () => {
  it('returns the unavailable hinge for no input', () => {
    expect(createHingeState()).toBe(UNAVAILABLE_HINGE);
    expect(createHingeState(null)).toBe(UNAVAILABLE_HINGE);
  });

  it('expands the shorthand into an available hinge with exact degrees', () => {
    expect(createHingeState({ posture: 'partiallyOpen', angleDegrees: 90 })).toEqual({
      available: true,
      angleDegrees: 90,
      angleRadians: Math.PI / 2,
      posture: 'partiallyOpen',
    });
  });

  it('applies the same rules as real hinge events', () => {
    expect(createHingeState({ posture: 'fullyOpen', angleDegrees: Number.NaN })).toBe(
      UNAVAILABLE_HINGE,
    );
    const odd = { posture: 'tented', angleDegrees: 45 } as unknown as HingeInput;
    expect(createHingeState(odd).posture).toBe('unknown');
  });

  it('passes a full HingeState through unchanged', () => {
    const state = createHingeState({ posture: 'closed', angleDegrees: 0 });
    expect(createHingeState(state)).toBe(state);
  });
});

describe('HingeTestProvider', () => {
  function Posture() {
    const hinge = useHinge();
    return <>{hinge.available ? `${hinge.posture} ${hinge.angleDegrees}` : 'none'}</>;
  }

  it('reports no hinge by default', () => {
    let root!: ReactTestRenderer;
    act(() => {
      root = create(
        <HingeTestProvider>
          <Posture />
        </HingeTestProvider>,
      );
    });
    expect(root.toJSON()).toBe('none');
    act(() => root.unmount());
  });

  it('feeds useHinge and follows prop changes', () => {
    let root!: ReactTestRenderer;
    act(() => {
      root = create(
        <HingeTestProvider hinge={{ posture: 'partiallyOpen', angleDegrees: 90 }}>
          <Posture />
        </HingeTestProvider>,
      );
    });
    expect(root.toJSON()).toBe('partiallyOpen 90');

    act(() => {
      root.update(
        <HingeTestProvider hinge={{ posture: 'fullyOpen', angleDegrees: 180 }}>
          <Posture />
        </HingeTestProvider>,
      );
    });
    expect(root.toJSON()).toBe('fullyOpen 180');

    act(() => {
      root.update(
        <HingeTestProvider hinge={null}>
          <Posture />
        </HingeTestProvider>,
      );
    });
    expect(root.toJSON()).toBe('none');
    act(() => root.unmount());
  });

  it('lets selectors skip angle-only changes, as on device', () => {
    const renders: string[] = [];
    function PostureOnly() {
      const posture = useHingeSelector((hinge) => hinge.posture);
      renders.push(posture);
      return null;
    }
    // Reuse one child element so only store updates, not the provider's own
    // re-render, can re-render it (as with pane content on device).
    const child = <PostureOnly />;
    const tree = (angleDegrees: number, posture: 'partiallyOpen' | 'fullyOpen') => (
      <HingeTestProvider hinge={{ posture, angleDegrees }}>{child}</HingeTestProvider>
    );

    let root!: ReactTestRenderer;
    act(() => {
      root = create(tree(90, 'partiallyOpen'));
    });
    act(() => root.update(tree(120, 'partiallyOpen')));
    act(() => root.update(tree(150, 'partiallyOpen')));
    expect(renders).toEqual(['partiallyOpen']);

    act(() => root.update(tree(180, 'fullyOpen')));
    expect(renders).toEqual(['partiallyOpen', 'fullyOpen']);
    act(() => root.unmount());
  });
});
