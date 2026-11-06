import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { EventFields } from '@/data/types';

/**
 * The event being edited in Create New Event, shared with its pushed
 * sub-screens (Event details, Date & time) and its Lineup. Unsaved until
 * Save as draft or Create & publish.
 */
export type EventDraft = {
  /** "new" until the first save, then the event id. */
  key: string;
  communityId: string;
  fields: EventFields;
  /** Which open Create New Event screen started this draft. */
  session: string;
};

type DraftContextValue = {
  draft: EventDraft | null;
  begin: (draft: EventDraft) => void;
  update: (patch: Partial<EventFields>) => void;
  rekey: (key: string) => void;
  /** Drop the draft when the form that started it closes. */
  end: (session: string) => void;
};

const DraftContext = createContext<DraftContextValue | null>(null);

export function EventDraftProvider({ children, initial = null }: { children: ReactNode; initial?: EventDraft | null }) {
  const [draft, setDraft] = useState<EventDraft | null>(initial);
  const begin = useCallback((d: EventDraft) => setDraft(d), []);
  const update = useCallback(
    (patch: Partial<EventFields>) => setDraft((d) => (d ? { ...d, fields: { ...d.fields, ...patch } } : d)),
    [],
  );
  const rekey = useCallback((key: string) => setDraft((d) => (d ? { ...d, key } : d)), []);
  const end = useCallback((session: string) => setDraft((d) => (d?.session === session ? null : d)), []);
  const value = useMemo(() => ({ draft, begin, update, rekey, end }), [draft, begin, update, rekey, end]);
  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useEventDraft(): DraftContextValue {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useEventDraft must be used inside EventDraftProvider');
  return ctx;
}

/** The draft only when it is for this event (or "new"); null otherwise. */
export function useDraftFor(key: string | undefined): EventDraft | null {
  const { draft } = useEventDraft();
  return draft && key && draft.key === key ? draft : null;
}
