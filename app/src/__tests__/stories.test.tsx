import fs from 'node:fs';
import path from 'node:path';

import { composeStories, setProjectAnnotations } from '@storybook/react';
import { act, render } from '@testing-library/react-native';
import type { ComponentType } from 'react';

import { withMemberly } from '../../.storybook/decorators';

/**
 * Every story in the library renders with the app's providers, the same way
 * the browser renders it (`withMemberly` from .storybook/decorators.tsx).
 * A story that throws fails here, so a broken story never reaches the
 * published Storybook. Fonts are left out: they load only in a browser.
 */
setProjectAnnotations({ decorators: [withMemberly] });

const SRC = path.join(__dirname, '..');

function storyFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : storyFiles(full);
    return /\.stories\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

const files = storyFiles(SRC).sort();

it('finds the story files', () => {
  expect(files.length).toBeGreaterThan(0);
});

describe.each(files.map((f) => [path.relative(SRC, f), f]))('%s', (_name, file) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const stories = composeStories(require(file) as Parameters<typeof composeStories>[0]);
  it.each(Object.entries(stories) as [string, ComponentType][])('%s renders', async (_story, Story) => {
    const view = await render(<Story />);
    // Let sample-data reads settle before unmounting.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    view.unmount();
  });
});
