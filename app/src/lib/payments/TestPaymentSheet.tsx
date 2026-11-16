import { X } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, IconButton, Notice, OverlaySheet, Pill, Text } from '@/components/ui';
import type { FakeControls } from '@/data/fakeRepository';
import { formatCents } from '@/features/booking/money';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';

import type { PaymentResult, PaymentSheetSession } from './types';

export const TEST_PAYMENT_NOTE = 'A stand-in for the payment sheet. It never asks for card details and nothing is charged.';

/** What is being paid for, and what happens to the money. */
export function purposeLines({ purpose }: Pick<PaymentSheetSession, 'purpose'>): { caption: string; line: string } {
  return purpose.kind === 'hold'
    ? { caption: `Hold for ${purpose.djName} · ${purpose.eventName}`, line: `Held now. Charged only if ${purpose.djName} accepts.` }
    : { caption: `${purpose.passName} · ${purpose.eventName}`, line: 'Paid now. Your pass goes on your Memberly Card.' };
}

/**
 * The test payment sheet: what stands where the native payment sheet will
 * (M8), on the fake repository only. It shows the server's total and two
 * outcomes to pick from. There are no card fields here and there never will
 * be: the app does not collect payment details.
 */
export function TestPaymentSheet({
  session,
  fake,
  onResult,
}: {
  session: PaymentSheetSession;
  fake: FakeControls;
  onResult: (result: PaymentResult) => void;
}) {
  const c = useTheme();
  const [declined, setDeclined] = useState<string | null>(null);
  const [busy, setBusy] = useState<'pay' | 'decline' | null>(null);
  const { caption, line } = purposeLines(session);

  // Closing after a decline reports the decline; closing untouched is a cancel.
  const close = () => {
    if (busy) return;
    onResult(declined ? { status: 'failed', message: declined } : { status: 'cancelled' });
  };
  const pay = async () => {
    setBusy('pay');
    const outcome = await fake.confirmPayment(session.clientSecret);
    setBusy(null);
    if (outcome.status === 'succeeded') onResult({ status: 'succeeded' });
    else setDeclined(outcome.message);
  };
  const decline = async () => {
    setBusy('decline');
    const outcome = await fake.declinePayment(session.clientSecret);
    setBusy(null);
    if (outcome.status === 'failed') setDeclined(outcome.message);
  };

  return (
    <OverlaySheet visible onClose={close} testID="test-payment-sheet" accessibilityLabel="Test payment" closeLabel="Close payment">
      <View style={styles.top}>
        <Pill label="Test payment" tone="warning" style={styles.pill} />
        <IconButton
          testID="test-payment-close"
          accessibilityLabel="Close"
          size={36}
          icon={<X size={18} color={c.foreground} strokeWidth={2} />}
          onPress={close}
        />
      </View>
      <View style={styles.amount}>
        <Text variant="secondary" tone="muted">
          {caption}
        </Text>
        <Text variant="money" style={styles.total} testID="test-payment-total">
          {formatCents(session.totalCents)}
        </Text>
        <Text variant="helper" tone="muted">
          {line}
        </Text>
      </View>
      {declined ? <Notice tone="error">{declined}</Notice> : null}
      <View style={styles.actions}>
        <Button testID="test-payment-pay" label="Pay with test wallet" loading={busy === 'pay'} disabled={busy === 'decline'} onPress={() => void pay()} />
        <Button
          testID="test-payment-decline"
          label="Use a declined test card"
          variant="secondary"
          loading={busy === 'decline'}
          disabled={busy === 'pay'}
          onPress={() => void decline()}
        />
      </View>
      <Text variant="helper" tone="muted" align="center">
        {TEST_PAYMENT_NOTE}
      </Text>
    </OverlaySheet>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: { alignSelf: 'center' },
  amount: { gap: space.xs },
  total: { fontSize: 32, lineHeight: 36 },
  actions: { gap: space.stack },
});
