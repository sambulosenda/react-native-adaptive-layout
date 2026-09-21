const seen = new Set<string>();

/** Emits each distinct message once per JS runtime, and never in production. */
export function warnOnce(messages: readonly string[]): void {
  if (process.env.NODE_ENV === 'production') return;
  for (const message of messages) {
    if (seen.has(message)) continue;
    seen.add(message);
    console.warn(`[react-native-foldable] ${message}`);
  }
}

/** Test-only escape hatch so warnings can be asserted more than once. */
export function resetWarnings(): void {
  seen.clear();
}
