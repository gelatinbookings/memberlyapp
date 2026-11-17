import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { GroupedList, Notice, Pill, Sheet, Text } from '@/components/ui';
import type { TestAccount, TestAccountId } from '@/data/testAccounts';
import { useTheme } from '@/theme/theme';
import { size, space } from '@/theme/tokens';

import { useAuth } from '../AuthProvider';
import { LinkLine } from './ProviderButtons';

export const TEST_ACCOUNTS_TITLE = 'Test accounts';
export const TEST_ACCOUNTS_NOTE = 'Sample people on sample data. None is a real account, and nothing you do as them is sent or charged.';
export const TEST_ACCOUNTS_FAILED = 'Couldn’t sign in as that account. Try again.';

/**
 * The way into the four test accounts, on the Sign in sheet. It exists only
 * while the app runs on the sample (fake) repository, in development and
 * release builds alike, and renders nothing once a real repository is
 * configured. Tapping an account signs in as it; typing its email and the
 * sample code does the same.
 */
export function TestAccountsEntry() {
  const { testAccounts, signInAsTestAccount } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<TestAccountId | null>(null);
  const [failed, setFailed] = useState(false);
  if (!testAccounts) return null;

  const pick = async (account: TestAccount) => {
    if (busy) return;
    setBusy(account.id);
    setFailed(false);
    try {
      // The gate takes over from here: onboarding, or the tabs.
      await signInAsTestAccount(account.id);
    } catch {
      setBusy(null);
      setFailed(true);
    }
  };

  return (
    <>
      <LinkLine lead="Running on sample data." action={TEST_ACCOUNTS_TITLE} onPress={() => setOpen(true)} />
      <Sheet visible={open} onClose={() => (busy ? undefined : setOpen(false))} title={TEST_ACCOUNTS_TITLE} subtitle={TEST_ACCOUNTS_NOTE} testID="test-accounts">
        <Pill label="Test data" tone="warning" />
        {failed ? <Notice tone="error">{TEST_ACCOUNTS_FAILED}</Notice> : null}
        <GroupedList>
          {testAccounts.map((account) => (
            <AccountRow key={account.id} account={account} busy={busy === account.id} disabled={busy != null} onPress={() => void pick(account)} />
          ))}
        </GroupedList>
      </Sheet>
    </>
  );
}

function AccountRow({ account, busy, disabled, onPress }: { account: TestAccount; busy: boolean; disabled: boolean; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      testID={`test-account-${account.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${account.label}. ${account.description}`}
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? { backgroundColor: c.muted } : null]}>
      <View style={styles.flex}>
        <Text variant="bodyStrong">{account.label}</Text>
        <Text variant="helper" tone="muted">
          {account.description}
        </Text>
      </View>
      {busy ? <ActivityIndicator color={c.mutedText} /> : <ChevronRight size={16} color={c.mutedText} strokeWidth={2} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: size.minTarget, paddingHorizontal: space.card, paddingVertical: space.row, flexDirection: 'row', alignItems: 'center', gap: space.row },
  flex: { flex: 1, minWidth: 0, gap: 2 },
});
