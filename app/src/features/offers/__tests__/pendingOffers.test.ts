import type { KeyValueStorage } from '@/data/types';

import { clearPendingOffer, ensurePendingOffer, listPendingOffers, markPendingOffer, PENDING_OFFERS_INDEX } from '../pendingOffers';

/** One keychain, opened by more than one run of the app. */
function keychain() {
  const data = new Map<string, string>();
  const open = (): KeyValueStorage => ({
    get: async (k) => data.get(k) ?? null,
    set: async (k, v) => {
      data.set(k, v);
    },
    remove: async (k) => {
      data.delete(k);
    },
  });
  return { data, open };
}

const KOYO = { eventId: 'e_late_service', djId: 'dj_koyo', offerCents: 45000, note: '' };

describe('the stored clientOfferId', () => {
  it('is made once and kept for every retry', async () => {
    const storage = keychain().open();
    const first = await ensurePendingOffer(storage, KOYO);
    const second = await ensurePendingOffer(storage, KOYO);
    expect(first.clientOfferId).toMatch(/^offer_/);
    expect(second.clientOfferId).toBe(first.clientOfferId);
  });

  it('survives a cold start: a new run of the app reads the same id from secure storage', async () => {
    const chain = keychain();
    const before = await ensurePendingOffer(chain.open(), KOYO);
    // The app is closed and opened again: nothing in memory, only the keychain.
    const afterRestart = chain.open();
    expect(await listPendingOffers(afterRestart)).toEqual([before]);
    expect((await ensurePendingOffer(afterRestart, KOYO)).clientOfferId).toBe(before.clientOfferId);
  });

  it('is separate for each DJ and each event, and is forgotten once the answer arrives', async () => {
    const storage = keychain().open();
    const koyo = await ensurePendingOffer(storage, KOYO);
    const nightform = await ensurePendingOffer(storage, { ...KOYO, djId: 'dj_nightform', offerCents: 60000 });
    const elsewhere = await ensurePendingOffer(storage, { ...KOYO, eventId: 'e_long_table' });
    expect(new Set([koyo.clientOfferId, nightform.clientOfferId, elsewhere.clientOfferId]).size).toBe(3);

    await clearPendingOffer(storage, KOYO);
    expect((await listPendingOffers(storage)).map((o) => `${o.eventId}:${o.djId}`)).toEqual([
      'e_late_service:dj_nightform',
      'e_long_table:dj_koyo',
    ]);
    // A later offer to the same DJ is a new request with a new id.
    expect((await ensurePendingOffer(storage, KOYO)).clientOfferId).not.toBe(koyo.clientOfferId);
  });

  it('keeps the queued mark and the id together, and uses only keys secure storage accepts', async () => {
    const chain = keychain();
    const storage = chain.open();
    const queued = await ensurePendingOffer(storage, KOYO, { queued: true });
    expect(queued.queued).toBe(true);
    // Sending it again later, without the flag, is still the queued offer with the same id.
    expect(await ensurePendingOffer(storage, KOYO)).toMatchObject({ queued: true, clientOfferId: queued.clientOfferId });
    await markPendingOffer(storage, KOYO, { queued: false, unavailable: true });
    expect((await listPendingOffers(storage))[0]).toMatchObject({ queued: false, unavailable: true, clientOfferId: queued.clientOfferId });
    expect([...chain.data.keys()].every((k) => /^[A-Za-z0-9._-]+$/.test(k))).toBe(true);
    expect(chain.data.has(PENDING_OFFERS_INDEX)).toBe(true);
  });

  it('does not lose entries when several offers are stored at once', async () => {
    const storage = keychain().open();
    await Promise.all(['a', 'b', 'c', 'd'].map((dj) => ensurePendingOffer(storage, { ...KOYO, djId: `dj_${dj}` })));
    expect((await listPendingOffers(storage)).map((o) => o.djId).sort()).toEqual(['dj_a', 'dj_b', 'dj_c', 'dj_d']);
  });
});
