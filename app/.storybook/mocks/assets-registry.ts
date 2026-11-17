/**
 * Storybook-only stand-in for `@react-native/assets-registry/registry`, which
 * React Native 0.88 no longer installs but react-native-svg's web build still
 * imports. On the web Vite turns every image into a URL, so no numeric asset
 * id ever reaches these functions.
 */
type Asset = { httpServerLocation: string; name: string; type: string; width?: number; height?: number; scales: number[] };

const assets: Asset[] = [];

export function registerAsset(asset: Asset): number {
  return assets.push(asset);
}

export function getAssetByID(id: number): Asset | undefined {
  return assets[id - 1];
}
