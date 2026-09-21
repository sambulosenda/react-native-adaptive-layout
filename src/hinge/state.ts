import type { FoldPosture, HingeState } from '../types';

export const UNAVAILABLE_HINGE: HingeState = Object.freeze({
  available: false,
  angleRadians: null,
  angleDegrees: null,
  posture: 'unknown',
});

const POSTURES: ReadonlySet<string> = new Set<FoldPosture>([
  'closed',
  'partiallyOpen',
  'fullyOpen',
]);

/** Raw payload as emitted by the native layout. */
export interface NativeHingePayload {
  available: boolean;
  angle: number;
  posture: string;
}

/**
 * Converts a native payload into a `HingeState`. Unknown postures from newer
 * OS releases degrade to `'unknown'`; a non-finite angle becomes `null`.
 */
export function toHingeState(payload: NativeHingePayload): HingeState {
  if (!payload.available) return UNAVAILABLE_HINGE;
  const angleRadians = Number.isFinite(payload.angle) ? payload.angle : null;
  return {
    available: true,
    angleRadians,
    angleDegrees: angleRadians === null ? null : (angleRadians * 180) / Math.PI,
    posture: POSTURES.has(payload.posture) ? (payload.posture as FoldPosture) : 'unknown',
  };
}

export function isSameHinge(a: HingeState, b: HingeState): boolean {
  return (
    a.available === b.available && a.angleRadians === b.angleRadians && a.posture === b.posture
  );
}
