import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { StyleSheet, View, type ModalProps } from 'react-native';

import { darkPalette } from '../../src/theme/tokens';
import { useModalHost } from './modal-host';

/**
 * React Native's `Modal` for the browser build of the library.
 *
 * react-native-web's Modal portals to `document.body`, so a sheet or dialog
 * covered the whole canvas (and, on a Docs page, every story on it). This
 * stand-in draws the same children in the story's own phone frame instead:
 * a full-size layer over the 390-wide phone, only while `visible`. Escape
 * calls `onRequestClose`, as the hardware back button does on Android.
 *
 * The app's components are unchanged: `main.ts` rewrites, at bundle time,
 * the `Modal` import of any file under `src/` to `./react-native.ts`. Jest
 * keeps React Native's own Modal.
 */
export function Modal({ visible = true, transparent, onRequestClose, onShow, children, testID }: ModalProps & { children?: ReactNode }) {
  const host = useModalHost();

  useEffect(() => {
    if (!visible) return;
    onShow?.({} as never);
    if (!onRequestClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onRequestClose({} as never);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // Only on opening and closing, as React Native calls them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;
  const layer = (
    <View
      testID={testID}
      accessibilityViewIsModal
      style={[StyleSheet.absoluteFill, transparent ? null : styles.opaque]}>
      {children}
    </View>
  );
  // The frame's layer attaches on the first pass; the modal draws from the second.
  return host ? createPortal(layer, host) : null;
}

const styles = StyleSheet.create({
  opaque: { backgroundColor: darkPalette.background },
});
