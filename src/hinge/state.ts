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
 * OS releases degrade to `'unknown'`. A hinge whose angle cannot be read (a
 * non-finite value) is reported as unavailable, so `available: true` always
 * carries a numeric angle.
 */
export function toHingeState(payload: NativeHingePayload): HingeState {
  if (!payload.available || !Number.isFinite(payload.angle)) return UNAVAILABLE_HINGE;
  const angleRadians = payload.angle;
  return {
    available: true,
    angleRadians,
    angleDegrees: (angleRadians * 180) / Math.PI,
    posture: POSTURES.has(payload.posture) ? (payload.posture as FoldPosture) : 'unknown',
  };
}

export function isSameHinge(a: HingeState, b: HingeState): boolean {
  return (
    a.available === b.available && a.angleRadians === b.angleRadians && a.posture === b.posture
  );
}
