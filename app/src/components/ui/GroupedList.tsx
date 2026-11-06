import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/theme';
import { radius } from '@/theme/tokens';

/** Rows inside one card, separated by 1px rules. Never nested cards. */
export function GroupedList({ children }: { children: ReactNode }) {
  const c = useTheme();
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.list, { backgroundColor: c.card, borderColor: c.border }]}>
      {items.map((child, i) => (
        <Fragment key={i}>
          {i > 0 ? <View style={[styles.rule, { backgroundColor: c.border }]} /> : null}
          {child}
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { borderRadius: radius.card, borderWidth: 1, overflow: 'hidden' },
  rule: { height: 1 },
});
