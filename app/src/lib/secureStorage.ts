import * as SecureStore from 'expo-secure-store';

import type { KeyValueStorage } from '@/data/types';

/** The device keychain via expo-secure-store. Sessions and the cached card live here. */
export const secureStorage: KeyValueStorage = {
  get: (key) => SecureStore.getItemAsync(key),
  set: (key, value) => SecureStore.setItemAsync(key, value),
  remove: (key) => SecureStore.deleteItemAsync(key),
};
