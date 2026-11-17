import * as ImagePicker from 'expo-image-picker';

/**
 * Choose one photo from the phone's library, for a community cover. Null when
 * the picker is closed without a choice. iOS shows its own photo picker,
 * which needs no permission prompt: the app only ever sees the photo chosen.
 */
export async function pickCoverPhoto(): Promise<{ uri: string } | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
  if (result.canceled) return null;
  const [asset] = result.assets;
  return asset ? { uri: asset.uri } : null;
}
