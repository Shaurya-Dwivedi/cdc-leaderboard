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
