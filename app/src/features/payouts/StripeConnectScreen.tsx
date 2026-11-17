import { useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { BadgeCheck, Building, Check, Landmark, Lock, ShieldCheck, UserRound, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, Card, Chip, ErrorState, IconButton, LoadingRows, Notice, Pill, Screen, Spinner, Text, TextField } from '@/components/ui';
import { getFakeControls } from '@/data/fakeRepository';
import { useOrganizedCommunities, useRepository, useStripeAccount, useViewer } from '@/data/RepositoryProvider';
import type { Community, Viewer } from '@/data/types';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';

/** Where Stripe sends the organizer back once onboarding ends (real Stripe only). */
export const STRIPE_RETURN_PATH = '/return/stripe';

export const STRIPE_TEST_NOTE = 'Test mode. This stands in for Stripe’s onboarding, on sample data. Nothing is verified and no money moves.';
export const STRIPE_LEAVE_TITLE = 'Leave Stripe setup?';
export const STRIPE_LEAVE_DETAIL = 'What you entered is kept. You can finish from Manage.';
export const STRIPE_DONE_TITLE = 'Payouts are set up';

const STEPS = ['intro', 'verify', 'business', 'details', 'payouts', 'review'] as const;
type Step = (typeof STEPS)[number] | 'submitting' | 'done';

type BusinessType = 'individual' | 'company' | 'nonprofit';
const BUSINESS_TYPES: { id: BusinessType; label: string }[] = [
  { id: 'individual', label: 'Individual' },
  { id: 'company', label: 'Company' },
  { id: 'nonprofit', label: 'Nonprofit' },
];
const INDUSTRIES = ['Events and nightlife', 'Membership organization', 'Other'];

/** Stripe's published test values: they pass verification in test mode. */
const TEST = {
  phone: '000-000-0000',
  code: '000000',
  dob: '01/01/1901',
  ssnLast4: '0000',
  street: '123 Test Street',
  cityLine: 'Atlanta, GA 30303',
  routing: '110000000',
  account: '000123456789',
};

/**
 * Connect Stripe (Stripe Connect, Express). The backend mints a one-time
 * onboarding link for the community. With the real backend that link opens in
 * the in-app browser and Stripe brings the organizer back. On sample data
 * there is nothing real to open, so this screen plays Stripe's onboarding:
 * contact, business, representative, payout account, review, done.
 */
export function StripeConnectScreen({ communityId }: { communityId: string }) {
  const repo = useRepository();
  const fake = getFakeControls(repo);
  const qc = useQueryClient();
  const [link, setLink] = useState<'loading' | 'ready' | 'failed'>('loading');
  const started = useRef(false);

  const refresh = () => qc.invalidateQueries();
  const leave = () => (router.canGoBack() ? router.back() : router.replace('/manage'));

  const open = async () => {
    setLink('loading');
    try {
      const { url } = await repo.createStripeOnboarding(communityId);
      if (fake) return setLink('ready');
      // Real Stripe: its hosted onboarding, in the in-app browser, back through memberly://return/stripe.
      await WebBrowser.openAuthSessionAsync(url, Linking.createURL(STRIPE_RETURN_PATH));
      await refresh();
      leave();
    } catch {
      setLink('failed');
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    open();
    // Opened once per visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (link === 'failed') {
    return (
      <Screen header={<CloseRow onClose={leave} />}>
        <ErrorState title="Couldn’t open Stripe" detail="Nothing was changed. Try again in a moment." onRetry={open} />
      </Screen>
    );
  }
  if (link === 'loading' || !fake) {
    return (
      <Screen header={<CloseRow onClose={leave} />}>
        <LoadingRows count={3} label="Opening Stripe" />
      </Screen>
    );
  }
  return (
    <TestOnboarding
      communityId={communityId}
      onLeave={async (finished) => {
        if (!finished) fake.finishStripeOnboarding(communityId, { finished: false });
        await refresh();
        leave();
      }}
      onFinish={async (bankLast4) => {
        fake.finishStripeOnboarding(communityId, { finished: true, bankLast4 });
        await refresh();
      }}
    />
  );
}

function CloseRow({ onClose, step }: { onClose: () => void; step?: number }) {
  const c = useTheme();
  return (
    <View style={styles.top}>
      <IconButton accessibilityLabel="Close Stripe setup" icon={<X size={18} color={c.foreground} strokeWidth={2} />} onPress={onClose} />
      <View style={styles.flex}>
        <Text variant="bodyStrong">Set up payouts</Text>
        <Text variant="helper" tone="muted">
          Secured by Stripe
        </Text>
      </View>
      <Pill label="Test mode" tone="warning" />
      {step != null ? (
        <View style={[styles.progress, { backgroundColor: c.muted }]} accessible accessibilityLabel={`Step ${step + 1} of ${STEPS.length}`}>
          <View style={[styles.progressFill, { backgroundColor: c.brand, width: `${((step + 1) / STEPS.length) * 100}%` }]} />
        </View>
      ) : null}
    </View>
  );
}

function Title({ title, detail }: { title: string; detail?: string }) {
  return (
    <View style={styles.title}>
      <Text variant="display" accessibilityRole="header">
        {title}
      </Text>
      {detail ? <Text tone="muted">{detail}</Text> : null}
    </View>
  );
}

function ReviewRow({ Icon, label, value, onEdit }: { Icon: typeof Check; label: string; value: string; onEdit: () => void }) {
  const c = useTheme();
  return (
    <View style={styles.reviewRow}>
      <Icon size={18} color={c.mutedText} strokeWidth={2} />
      <View style={styles.flex}>
        <Text variant="helper" tone="muted">
          {label}
        </Text>
        <Text variant="body">{value}</Text>
      </View>
      <Chip label="Edit" onPress={onEdit} accessibilityLabel={`Edit ${label}`} />
    </View>
  );
}

type OnboardingProps = {
  communityId: string;
  onLeave: (finished: boolean) => void;
  onFinish: (bankLast4: string) => Promise<void>;
};

/** Waits for who is signing up and for which community, so the steps start filled in. */
function TestOnboarding(props: OnboardingProps) {
  const viewer = useViewer();
  const organized = useOrganizedCommunities();
  if (!viewer.data || !organized.data) {
    return (
      <Screen header={<CloseRow onClose={() => props.onLeave(false)} />}>
        <LoadingRows count={3} label="Opening Stripe" />
      </Screen>
    );
  }
  return <OnboardingSteps {...props} viewer={viewer.data} community={organized.data.find((x) => x.id === props.communityId)} />;
}

function OnboardingSteps({
  communityId,
  onLeave,
  onFinish,
  viewer,
  community,
}: OnboardingProps & { viewer: Viewer; community: Community | undefined }) {
  const c = useTheme();
  const account = useStripeAccount(communityId);
  const [step, setStep] = useState<Step>('intro');
  const [codeSent, setCodeSent] = useState(false);
  const [form, setForm] = useState({
    email: viewer.email,
    phone: TEST.phone,
    code: '',
    type: 'individual' as BusinessType,
    industry: INDUSTRIES[0],
    website: community ? `withmemberly.com/c/${community.id}` : '',
    first: viewer.firstName,
    last: viewer.lastName,
    dob: TEST.dob,
    street: TEST.street,
    cityLine: TEST.cityLine,
    ssnLast4: TEST.ssnLast4,
    routing: TEST.routing,
    account: TEST.account,
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const index = STEPS.indexOf(step as (typeof STEPS)[number]);
  const next = () => setStep(STEPS[index + 1] ?? 'review');
  const last4 = form.account.slice(-4);
  const name = community?.name ?? 'your community';

  const close = () => {
    if (step === 'done') return onLeave(true);
    if (step === 'intro') return onLeave(false);
    Alert.alert(STRIPE_LEAVE_TITLE, STRIPE_LEAVE_DETAIL, [
      { text: 'Keep going', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => onLeave(false) },
    ]);
  };

  const submit = async () => {
    setStep('submitting');
    await new Promise((r) => setTimeout(r, 1200));
    await onFinish(last4);
    setStep('done');
  };

  const filled = (...values: string[]) => values.every((v) => v.trim().length > 0);
  const footer = (() => {
    switch (step) {
      case 'intro':
        return <Button testID="stripe-continue" label="Agree and continue" onPress={next} />;
      case 'verify':
        return codeSent ? (
          <Button testID="stripe-continue" label="Verify" disabled={form.code.length !== 6} onPress={next} />
        ) : (
          <Button testID="stripe-send-code" label="Send code" disabled={!filled(form.email, form.phone)} onPress={() => setCodeSent(true)} />
        );
      case 'business':
        return <Button testID="stripe-continue" label="Continue" onPress={next} />;
      case 'details':
        return <Button testID="stripe-continue" label="Continue" disabled={!filled(form.first, form.last, form.dob, form.street, form.cityLine, form.ssnLast4)} onPress={next} />;
      case 'payouts':
        return <Button testID="stripe-continue" label="Continue" disabled={!filled(form.routing, form.account)} onPress={next} />;
      case 'review':
        return <Button testID="stripe-submit" label="Agree and submit" onPress={submit} />;
      case 'done':
        return <Button testID="stripe-done" label="Back to Memberly" onPress={() => onLeave(true)} />;
      default:
        return null;
    }
  })();

  return (
    <Screen header={<CloseRow onClose={close} step={index >= 0 ? index : undefined} />} footer={footer} testID={`stripe-step-${step}`}>
      {step === 'intro' ? (
        <>
          <Title title={`Get paid for ${name}`} detail="Memberly uses Stripe to pay out membership and pass sales to you. It takes about five minutes." />
          <Card style={styles.list}>
            {[
              { Icon: UserRound, text: 'Your contact details and date of birth' },
              { Icon: Building, text: 'How you run the community: as yourself, a company or a nonprofit' },
              { Icon: Landmark, text: 'The bank account payouts go to' },
            ].map(({ Icon, text }) => (
              <View key={text} style={styles.listRow}>
                <Icon size={18} color={c.brandText} strokeWidth={2} />
                <Text variant="body" style={styles.flex}>
                  {text}
                </Text>
              </View>
            ))}
          </Card>
          <View style={styles.listRow}>
            <Lock size={14} color={c.mutedText} strokeWidth={2} />
            <Text variant="helper" tone="muted" style={styles.flex}>
              Stripe keeps these details. Memberly never sees your full bank or tax numbers.
            </Text>
          </View>
          <Notice tone="tint">{STRIPE_TEST_NOTE}</Notice>
        </>
      ) : null}

      {step === 'verify' ? (
        <>
          <Title title="Verify it’s you" detail="Stripe texts a code to this number before anything is saved." />
          <TextField label="Email" value={form.email} onChangeText={(email) => set({ email })} autoCapitalize="none" keyboardType="email-address" />
          <TextField label="Mobile number" value={form.phone} onChangeText={(phone) => set({ phone })} keyboardType="phone-pad" helper="Test number" />
          {codeSent ? (
            <View style={styles.block}>
              <TextField
                testID="stripe-code"
                label="6-digit code"
                value={form.code}
                onChangeText={(code) => set({ code: code.replace(/\D/g, '').slice(0, 6) })}
                keyboardType="number-pad"
                maxLength={6}
                helper={`Sent to ${form.phone}`}
              />
              <Chip testID="stripe-test-code" label={`Use test code ${TEST.code}`} onPress={() => set({ code: TEST.code })} />
            </View>
          ) : null}
        </>
      ) : null}

      {step === 'business' ? (
        <>
          <Title title="About your business" detail={`How ${name} takes payments.`} />
          <View style={styles.block}>
            <Text variant="secondaryStrong">Business type</Text>
            <View style={styles.chips} accessibilityRole="radiogroup">
              {BUSINESS_TYPES.map((t) => (
                <Chip key={t.id} label={t.label} selected={form.type === t.id} onPress={() => set({ type: t.id })} />
              ))}
            </View>
          </View>
          <View style={styles.block}>
            <Text variant="secondaryStrong">Industry</Text>
            <View style={styles.chips} accessibilityRole="radiogroup">
              {INDUSTRIES.map((i) => (
                <Chip key={i} label={i} selected={form.industry === i} onPress={() => set({ industry: i })} />
              ))}
            </View>
          </View>
          <TextField label="Website" value={form.website} onChangeText={(website) => set({ website })} autoCapitalize="none" helper="Your community’s Memberly page works." />
        </>
      ) : null}

      {step === 'details' ? (
        <>
          <Title
            title={form.type === 'individual' ? 'Your details' : 'Company representative'}
            detail="Stripe checks these against public records, as the law requires for payouts."
          />
          <View style={styles.row2}>
            <TextField label="Legal first name" value={form.first} onChangeText={(first) => set({ first })} style={styles.flex} />
            <TextField label="Last name" value={form.last} onChangeText={(last) => set({ last })} style={styles.flex} />
          </View>
          <TextField label="Date of birth" value={form.dob} onChangeText={(dob) => set({ dob })} placeholder="MM/DD/YYYY" helper="Test date" />
          <TextField label="Home address" value={form.street} onChangeText={(street) => set({ street })} />
          <TextField label="City, state and ZIP" hideLabel value={form.cityLine} onChangeText={(cityLine) => set({ cityLine })} />
          <TextField
            label="Last 4 of SSN"
            value={form.ssnLast4}
            onChangeText={(ssnLast4) => set({ ssnLast4: ssnLast4.replace(/\D/g, '').slice(0, 4) })}
            keyboardType="number-pad"
            maxLength={4}
            helper="Test value. Stripe asks for more only if it can’t verify you."
          />
        </>
      ) : null}

      {step === 'payouts' ? (
        <>
          <Title title="Where should payouts go?" detail="A US checking account in your name or your business’s." />
          <TextField label="Routing number" value={form.routing} onChangeText={(routing) => set({ routing: routing.replace(/\D/g, '').slice(0, 9) })} keyboardType="number-pad" />
          <TextField
            label="Account number"
            value={form.account}
            onChangeText={(account) => set({ account: account.replace(/\D/g, '').slice(0, 17) })}
            keyboardType="number-pad"
            helper="Stripe test bank account"
          />
          <Text variant="helper" tone="muted">
            Payouts arrive weekly, on Mondays. You can change this later in Stripe.
          </Text>
        </>
      ) : null}

      {step === 'review' ? (
        <>
          <Title title="Review and submit" detail="Check everything before Stripe verifies it." />
          <Card style={styles.review} testID="stripe-review-card">
            <ReviewRow Icon={UserRound} label="Contact" value={`${form.email} · ${form.phone}`} onEdit={() => setStep('verify')} />
            <ReviewRow
              Icon={Building}
              label="Business"
              value={`${BUSINESS_TYPES.find((t) => t.id === form.type)?.label} · ${form.industry}`}
              onEdit={() => setStep('business')}
            />
            <ReviewRow Icon={ShieldCheck} label="Representative" value={`${form.first} ${form.last} · born ${form.dob}`} onEdit={() => setStep('details')} />
            <ReviewRow Icon={Landmark} label="Payouts to" value={`STRIPE TEST BANK ••••${last4}`} onEdit={() => setStep('payouts')} />
          </Card>
          <Text variant="helper" tone="muted">
            By submitting you agree to Stripe’s Connected Account Agreement. Memberly’s fees are taken before each payout.
          </Text>
        </>
      ) : null}

      {step === 'submitting' ? (
        <View style={styles.center} accessibilityLabel="Verifying with Stripe">
          <Spinner />
          <Text tone="muted">Verifying your details</Text>
        </View>
      ) : null}

      {step === 'done' ? (
        <>
          <View style={styles.doneHead}>
            <View style={[styles.badge, { backgroundColor: c.successBg }]}>
              <BadgeCheck size={30} color={c.successText} strokeWidth={2} />
            </View>
            <Title title={STRIPE_DONE_TITLE} detail={`${name} can sell paid tiers and passes now.`} />
          </View>
          <Card style={styles.review} testID="stripe-account">
            <View style={styles.reviewRow}>
              <Landmark size={18} color={c.mutedText} strokeWidth={2} />
              <View style={styles.flex}>
                <Text variant="helper" tone="muted">
                  Payouts to
                </Text>
                <Text variant="body">{account.data?.payoutsTo ?? `STRIPE TEST BANK ••••${last4}`}</Text>
              </View>
            </View>
            <View style={styles.reviewRow}>
              <Check size={18} color={c.mutedText} strokeWidth={2} />
              <View style={styles.flex}>
                <Text variant="helper" tone="muted">
                  Schedule
                </Text>
                <Text variant="body">{account.data?.payoutSchedule ?? 'Weekly, on Mondays'}</Text>
              </View>
            </View>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.row, flexWrap: 'wrap' },
  progress: { width: '100%', height: 4, borderRadius: 2, overflow: 'hidden', marginTop: space.sm },
  progressFill: { height: 4, borderRadius: 2 },
  title: { gap: space.sm },
  list: { gap: space.card },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  block: { gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  row2: { flexDirection: 'row', gap: space.stack },
  review: { gap: space.md },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: space.row },
  center: { alignItems: 'center', gap: space.md, paddingVertical: 80 },
  doneHead: { gap: space.md },
  badge: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
