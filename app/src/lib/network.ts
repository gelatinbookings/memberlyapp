import { addNetworkStateListener, useNetworkState } from 'expo-network';

/** False only when the device reports no connection; unknown counts as online. */
export function useOnline(): boolean {
  const state = useNetworkState();
  return state?.isConnected !== false;
}

/** Calls back whenever the device goes online or offline. Returns the unsubscribe. */
export function subscribeOnline(listener: (online: boolean) => void): () => void {
  const subscription = addNetworkStateListener((state) => listener(state.isConnected !== false));
  return () => subscription.remove();
}
