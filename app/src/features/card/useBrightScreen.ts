import { useEffect } from 'react';
import * as Brightness from 'expo-brightness';

/** Full brightness while the card is open so the door can scan it; back to where it was on close. */
export function useBrightScreen(): void {
  useEffect(() => {
    let previous: number | null = null;
    let cancelled = false;
    (async () => {
      try {
        previous = await Brightness.getBrightnessAsync();
        if (!cancelled) await Brightness.setBrightnessAsync(1);
      } catch {
        previous = null;
      }
    })();
    return () => {
      cancelled = true;
      if (previous != null) Brightness.setBrightnessAsync(previous).catch(() => undefined);
    };
  }, []);
}
