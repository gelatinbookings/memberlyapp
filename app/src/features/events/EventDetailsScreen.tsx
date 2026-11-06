import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ImageIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button, ErrorState, Screen, ScreenHeader, Text, TextField } from '@/components/ui';
import { useTheme } from '@/theme/theme';
import { radius, space } from '@/theme/tokens';

import { useEventDraft } from './EventDraftProvider';

const done = () => (router.canGoBack() ? router.back() : router.replace('/manage'));

/** Event details: name, tagline, description, cover. Edits the open draft. */
export function EventDetailsScreen() {
  const c = useTheme();
  const { draft, update } = useEventDraft();
  if (!draft) {
    return (
      <Screen>
        <ScreenHeader title="Event details" />
        <ErrorState title="No event open" detail="Open Create New Event from Manage first." />
      </Screen>
    );
  }
  const f = draft.fields;
  return (
    <Screen footer={<Button label="Done" onPress={done} />}>
      <ScreenHeader title="Event details" subtitle={f.name.trim() || 'New event'} />
      <View style={styles.cover}>
        {f.cover ? (
          <Image source={f.cover} style={styles.coverImage} contentFit="cover" accessibilityLabel="Cover photo" />
        ) : (
          <View style={[styles.coverImage, styles.placeholder, { backgroundColor: c.muted }]}>
            <ImageIcon size={22} color={c.mutedText} strokeWidth={2} />
          </View>
        )}
        <Text variant="helper" tone="muted">
          Choosing a cover from your camera roll comes in a later build.
        </Text>
      </View>
      <TextField
        testID="field-name"
        label="Event name"
        value={f.name}
        placeholder="Give the night a name"
        maxLength={80}
        onChangeText={(name) => update({ name })}
      />
      <TextField
        label="Tagline"
        value={f.tagline}
        placeholder="One line for the event page"
        maxLength={120}
        onChangeText={(tagline) => update({ tagline })}
      />
      <TextField
        label="Description"
        value={f.description}
        placeholder="What the night is, who it’s for"
        multiline
        maxLength={2000}
        onChangeText={(description) => update({ description })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cover: { gap: space.label },
  coverImage: { width: '100%', height: 150, borderRadius: radius.card },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
});
