import { describe, expect, it } from 'vitest';
import { exportSave, getState, importSave, update } from './store';

describe('backup codes', () => {
  it('round-trip the save, including non-ASCII names', () => {
    update((s) => ((s.name = 'Zoë 🐸'), (s.xp = 123), (s.onboarded = true)));
    const code = exportSave();
    update((s) => ((s.name = 'other'), (s.xp = 0)));
    expect(importSave(code)).toBe(true);
    expect(getState().name).toBe('Zoë 🐸');
    expect(getState().xp).toBe(123);
  });
  it('reject junk without changing anything', () => {
    const before = getState();
    expect(importSave('hello')).toBe(false);
    expect(importSave('MS1:' + btoa('{"v":1}'))).toBe(false);
    expect(getState()).toBe(before);
  });
});
