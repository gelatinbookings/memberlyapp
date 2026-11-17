import { router } from 'expo-router';

import type { PassScope } from './passForm';

/** Where a community's or an event's passes are listed. */
export function passListHref(scope: PassScope, parentId: string) {
  return scope === 'community'
    ? ({ pathname: '/organizer/communities/[id]/passes', params: { id: parentId } } as const)
    : ({ pathname: '/organizer/events/[id]/passes', params: { id: parentId } } as const);
}

/** The form for a new pass on this community or event. */
export function newPassHref(scope: PassScope, parentId: string) {
  return { pathname: '/organizer/passes/new', params: scope === 'community' ? { community: parentId } : { event: parentId } } as const;
}

/** The form for a pass that exists. */
export function editPassHref(scope: PassScope, parentId: string, passId: string) {
  return {
    pathname: '/organizer/passes/[id]',
    params: scope === 'community' ? { id: passId, community: parentId } : { id: passId, event: parentId },
  } as const;
}

export function openNewEvent(communityId?: string) {
  router.push(communityId ? { pathname: '/organizer/events/new', params: { community: communityId } } : '/organizer/events/new');
}
