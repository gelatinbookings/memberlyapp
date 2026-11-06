import { useCallback, useEffect, useState } from 'react';

/** 24 → "0:24", 75 → "1:15". */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Counts down once a second to zero; `restart` starts it again (after a resend). */
export function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const running = seconds > 0;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  const restart = useCallback((next: number) => setSeconds(next), []);
  return { seconds, done: !running, label: formatCountdown(seconds), restart };
}
