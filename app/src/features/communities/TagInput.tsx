import { Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Chip, Text, TextField } from '@/components/ui';
import { useTheme } from '@/theme/theme';
import { space } from '@/theme/tokens';

import { addTag, canAddTyped, canonicalTag, cleanTag, hasTag, removeTag, suggestTags, TAG_LIMIT } from './tags';

/**
 * One field for a community's discovery tags. What's chosen sits above as
 * chips that remove on a tap; below, a few suggestions to start, then matches
 * as you type, and the typed text itself as a tag of your own.
 */
export function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const c = useTheme();
  const [query, setQuery] = useState('');
  const full = tags.length >= TAG_LIMIT;
  const matches = full ? [] : suggestTags(query, tags);
  const typed = canonicalTag(query);
  const offerTyped = !full && canAddTyped(query, tags) && !matches.some((m) => m === typed);

  const add = (text: string) => {
    onChange(addTag(tags, text));
    setQuery('');
  };

  return (
    <View style={styles.wrap} testID="tag-input">
      {tags.length > 0 ? (
        <View style={styles.chips} testID="tags-chosen">
          {tags.map((t) => (
            <Chip
              key={t}
              testID={`tag-chosen-${t}`}
              label={t}
              selected
              accessibilityLabel={`Remove ${t}`}
              trailingIcon={<X size={14} color={c.brandText} strokeWidth={2.5} />}
              onPress={() => onChange(removeTag(tags, t))}
            />
          ))}
        </View>
      ) : null}

      <TextField
        testID="tag-field"
        label="Add a tag"
        hideLabel
        value={query}
        editable={!full}
        placeholder={full ? `That’s ${TAG_LIMIT}. Remove one to add another.` : 'Type a tag, like House or Rooftop'}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="done"
        submitBehavior="submit"
        onChangeText={(text) => setQuery(cleanTag(text))}
        onSubmitEditing={() => (query.trim() ? add(query) : undefined)}
      />

      {matches.length > 0 || offerTyped ? (
        <View style={styles.block}>
          <Text variant="helper" tone="muted">
            {query.trim() ? 'Matches' : 'Suggested'}
          </Text>
          <View style={styles.chips} testID="tag-suggestions">
            {matches.map((t) => (
              <Chip
                key={t}
                testID={`tag-suggest-${t}`}
                label={t}
                accessibilityLabel={`Add ${t}`}
                icon={<Plus size={14} color={c.mutedText} strokeWidth={2.5} />}
                onPress={() => add(t)}
              />
            ))}
            {offerTyped ? (
              <Chip
                testID="tag-add-typed"
                label={`Add “${typed}”`}
                accessibilityLabel={`Add your own tag, ${typed}`}
                icon={<Plus size={14} color={c.brandText} strokeWidth={2.5} />}
                onPress={() => add(query)}
              />
            ) : null}
          </View>
        </View>
      ) : null}

      <Text variant="helper" tone="muted">
        {`${tags.length} of ${TAG_LIMIT}`}
        {hasTag(tags, typed) && query.trim() ? ' · Already added' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.stack },
  block: { gap: space.label },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
