import { createElement, Fragment } from 'react';
import { describe, expect, it } from 'vitest';
import { Primary, resolveOverlayEdges, resolveSlots, Secondary } from '../src/layout/slots';

describe('resolveSlots', () => {
  it('matches slots by identity regardless of order', () => {
    const secondary = createElement(Secondary, null, 'b');
    const primary = createElement(Primary, null, 'a');
    const result = resolveSlots([secondary, primary]);
    // Children.toArray clones elements, so compare by type and content.
    expect(result.primary).toMatchObject({ type: Primary, props: { children: 'a' } });
    expect(result.secondary).toMatchObject({ type: Secondary, props: { children: 'b' } });
    expect(result.issues).toEqual([]);
  });

  it('preserves slot props such as overlayEdge', () => {
    const result = resolveSlots([
      createElement(Primary, { overlayEdge: 'trailing' }, 'a'),
      createElement(Secondary, null, 'b'),
    ]);
    expect(result.primary).toMatchObject({ props: { overlayEdge: 'trailing' } });
    expect(result.secondary?.props).not.toHaveProperty('overlayEdge');
  });

  it('keeps the first of duplicate slots and reports the rest', () => {
    const result = resolveSlots([
      createElement(Primary, { key: '1' }, 'a'),
      createElement(Primary, { key: '2' }, 'b'),
      createElement(Secondary, null),
    ]);
    expect(result.primary).toMatchObject({ type: Primary, props: { children: 'a' } });
    expect(result.issues).toEqual([
      expect.stringContaining('More than one FoldableLayout.Primary'),
    ]);
  });

  it('reports and ignores foreign children', () => {
    function Custom() {
      return null;
    }
    const result = resolveSlots([
      createElement(Primary, null),
      createElement(Secondary, null),
      createElement('div', null),
      createElement(Fragment, null),
      createElement(Custom, null),
      'text',
    ]);
    expect(result.issues).toEqual([
      expect.stringContaining('<div>'),
      expect.stringContaining('<Fragment>'),
      expect.stringContaining('<Custom>'),
      expect.stringContaining('string "text"'),
    ]);
  });

  it('reports missing slots', () => {
    const result = resolveSlots(null);
    expect(result.primary).toBeNull();
    expect(result.secondary).toBeNull();
    expect(result.issues).toEqual([
      expect.stringContaining('Primary is missing'),
      expect.stringContaining('Secondary is missing'),
    ]);
  });
});

describe('resolveOverlayEdges', () => {
  it('leaves both unset so the system chooses', () => {
    expect(resolveOverlayEdges(undefined, undefined)).toEqual({
      primary: 'none',
      secondary: 'none',
      issues: [],
    });
  });

  it('gives the other slot the opposite edge when only one is set', () => {
    expect(resolveOverlayEdges('trailing', undefined)).toMatchObject({
      primary: 'trailing',
      secondary: 'leading',
    });
    expect(resolveOverlayEdges(undefined, 'trailing')).toMatchObject({
      primary: 'leading',
      secondary: 'trailing',
    });
  });

  it('passes explicit edges through unchanged', () => {
    expect(resolveOverlayEdges('leading', 'trailing')).toEqual({
      primary: 'leading',
      secondary: 'trailing',
      issues: [],
    });
  });

  it('reports both panes claiming the same edge', () => {
    const result = resolveOverlayEdges('trailing', 'trailing');
    expect(result).toMatchObject({ primary: 'trailing', secondary: 'trailing' });
    expect(result.issues).toEqual([expect.stringContaining('overlap')]);
  });
});
