/**
 * `react-native` as the library's own components see it in the browser:
 * react-native-web, with `Modal` drawn inside the story's phone frame
 * (see `./Modal.tsx`). `main.ts` points a `src/` file's Modal import here; everything
 * else, including this file's own import, gets react-native-web unchanged.
 */
export * from 'react-native';
export { Modal } from './Modal';
