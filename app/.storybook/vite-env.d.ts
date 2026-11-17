/// <reference types="vite/client" />

/** The one react-dom call the browser build makes (the inline Modal's portal). The app has no react-dom types. */
declare module 'react-dom' {
  import type { ReactNode, ReactPortal } from 'react';
  export function createPortal(children: ReactNode, container: Element | DocumentFragment, key?: string | null): ReactPortal;
}
