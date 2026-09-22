import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWarnings, warnOnce } from '../src/warn';

describe('warnOnce', () => {
  afterEach(() => {
    resetWarnings();
    vi.restoreAllMocks();
  });

  it('emits each distinct message once with a package prefix', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnOnce(['a', 'b']);
    warnOnce(['a']);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledWith('[react-native-adaptive-layout] a');
  });

  it('is silent in production', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'production');
    warnOnce(['a']);
    expect(warn).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
