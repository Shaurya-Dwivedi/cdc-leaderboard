import { it, expect, vi } from 'vitest';

it('mock state survives a module reload', async () => {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
  const { MockApiClient } = await import('./mock');
  const before = (await new MockApiClient().getAuditLog()).length;
  await new MockApiClient().awardPoints({ memberId: 'm-4', delta: 5, reasonCategory: 'Other' as never });
  expect(store.size).toBe(1);

  vi.resetModules();
  const { MockApiClient: Fresh } = await import('./mock');
  expect((await new Fresh().getAuditLog()).length).toBe(before + 1);
});

it('added member persists and duplicate names are rejected', async () => {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
  vi.resetModules();
  const { MockApiClient } = await import('./mock');
  const added = await new MockApiClient().addMember('  Test   Person ');
  expect(added.name).toBe('Test Person');
  expect(added.role).toBe('viewer');
  await expect(new MockApiClient().addMember('test person')).rejects.toThrow('already exists');
  await expect(new MockApiClient().addMember('   ')).rejects.toThrow('1-80');

  vi.resetModules();
  const { MockApiClient: Fresh } = await import('./mock');
  expect((await new Fresh().getMembers()).some((m) => m.id === added.id)).toBe(true);
});

it('edited reward tiers persist and are validated', async () => {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
  vi.resetModules();
  const { MockApiClient } = await import('./mock');
  await new MockApiClient().setRewardTier(1, '  Trophy  ');
  await expect(new MockApiClient().setRewardTier(4, 'x')).rejects.toThrow('Place');
  await expect(new MockApiClient().setRewardTier(2, '  ')).rejects.toThrow('1-120');

  vi.resetModules();
  const { MockApiClient: Fresh } = await import('./mock');
  const tiers = await new Fresh().getRewardTiers();
  expect(tiers.find((t) => t.place === 1)?.label).toBe('Trophy');
});
