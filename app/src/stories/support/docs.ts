/**
 * Builds the docs page text every component in the library carries:
 * what it is, when to use it and when not, a usage snippet, accessibility
 * notes and the Do / Don't lines from DESIGN.md. Rendered as Markdown in
 * `parameters.docs.description.component`, above the props table.
 */
export type ComponentDoc = {
  /** One or two sentences: what it is. */
  what: string;
  /** When you'd reach for it. */
  use: string;
  /** When you wouldn't, and what to use instead. */
  avoid: string;
  /** A short TSX snippet. */
  usage: string;
  /** Role, spoken label, target size. */
  a11y: string[];
  do: string[];
  dont: string[];
  /**
   * States the component's code handles that no story shows, because the
   * sample world can't hold them still (a spinner between two answers, a
   * device setting). Each line says what it looks like and how to reach it.
   */
  unshown?: string[];
};

const list = (items: string[]) => items.map((i) => `- ${i}`).join('\n');

export function componentDocs(d: ComponentDoc): string {
  return [
    d.what,
    `**Use it** ${d.use}`,
    `**Don't use it** ${d.avoid}`,
    '#### Usage',
    '```tsx\n' + d.usage.trim() + '\n```',
    '#### Accessibility',
    list(d.a11y),
    '#### Do',
    list(d.do),
    "#### Don't",
    list(d.dont),
    ...(d.unshown?.length ? ['#### States without a story', list(d.unshown)] : []),
  ].join('\n\n');
}

/** A story's one-line description: when you'd see this state. */
export function storyDoc(text: string) {
  return { docs: { description: { story: text } } };
}
