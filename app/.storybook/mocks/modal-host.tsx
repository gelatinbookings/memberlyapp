import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * Where an inline Modal (see `./Modal.tsx`) draws in the browser: a layer
 * over the story's phone frame, so a sheet or dialog covers the phone and
 * not the whole canvas or docs page. `PhoneFrame` renders one per story.
 */
const HostContext = createContext<HTMLElement | null>(null);

/** The element an inline Modal portals into, or null outside a phone frame. */
export function useModalHost(): HTMLElement | null {
  return useContext(HostContext);
}

/** Wraps a story's phone frame and lays the modal layer over it, last, so it draws on top. */
export function ModalHost({ children }: { children: ReactNode }) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  // On the web a View's ref is its DOM element; elsewhere (Jest) it isn't, and nothing reads it.
  const attach = useCallback((v: unknown) => setNode(typeof HTMLElement !== 'undefined' && v instanceof HTMLElement ? v : null), []);
  return (
    <HostContext.Provider value={node}>
      {children}
      <View
        pointerEvents="box-none"
        style={styles.layer}
        ref={attach}
      />
    </HostContext.Provider>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill, zIndex: 1000 },
});
