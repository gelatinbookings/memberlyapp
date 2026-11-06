import type { StyleProp, ViewStyle } from 'react-native';

import { statusUi, type BookingStatus } from '@/features/booking/status';

import { Pill } from './Pill';

/** The booking status as the organizer reads it. Label and colour come from the fixed mapping. */
export function StatusPill({ status, style }: { status: BookingStatus | string; style?: StyleProp<ViewStyle> }) {
  const ui = statusUi(status);
  return <Pill label={ui.label} tone={ui.tone} style={style} />;
}
