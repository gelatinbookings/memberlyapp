/**
 * expo-image-picker for stories. The package ships TypeScript source the
 * browser bundler can't read, and a browser has no photo library anyway.
 * Picking returns "closed without a choice"; stories that need a photo pass
 * a sample one in directly.
 */
export type ImagePickerAsset = { uri: string; fileSize?: number; width: number; height: number };
export type ImagePickerResult = { canceled: true; assets: null } | { canceled: false; assets: ImagePickerAsset[] };

export async function launchImageLibraryAsync(): Promise<ImagePickerResult> {
  return { canceled: true, assets: null };
}

export async function launchCameraAsync(): Promise<ImagePickerResult> {
  return { canceled: true, assets: null };
}
