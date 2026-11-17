import * as ImagePicker from 'expo-image-picker';

/** A photo from the phone's library. `bytes` is its size when iOS reports one. */
export type LibraryPhoto = { uri: string; bytes?: number };

const toPhoto = (asset: ImagePicker.ImagePickerAsset): LibraryPhoto =>
  asset.fileSize != null ? { uri: asset.uri, bytes: asset.fileSize } : { uri: asset.uri };

/**
 * Choose one photo from the phone's library. Null when the picker is closed
 * without a choice. iOS shows its own photo picker, which needs no permission
 * prompt: the app only ever sees the photo chosen. `square` lets the person
 * crop it square first, for a logo.
 */
export async function pickPhoto({ square = false }: { square?: boolean } = {}): Promise<LibraryPhoto | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    ...(square ? { allowsEditing: true, aspect: [1, 1] as [number, number] } : null),
  });
  if (result.canceled) return null;
  const [asset] = result.assets;
  return asset ? toPhoto(asset) : null;
}

/** Choose up to `limit` photos at once, for a gallery. Empty when closed without a choice. */
export async function pickPhotos(limit: number): Promise<LibraryPhoto[]> {
  if (limit <= 0) return [];
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsMultipleSelection: true,
    selectionLimit: limit,
    orderedSelection: true,
  });
  if (result.canceled) return [];
  return result.assets.slice(0, limit).map(toPhoto);
}

/** Kept for the pass and event covers. */
export async function pickCoverPhoto(): Promise<{ uri: string } | null> {
  const photo = await pickPhoto();
  return photo ? { uri: photo.uri } : null;
}
