import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

/**
 * The app never works out a total. Every amount on screen is one the server
 * sent, shown through formatCents / formatRate. The fake server
 * (src/data/fakeRepository.ts) is the only file allowed to add a fee to an
 * offer or multiply a price.
 *
 * This guard reads the source and fails if feature, UI, route or library code
 * adds, subtracts or multiplies amounts in cents.
 */
const SRC = join(__dirname, '..');

/** The fake server: where totals are produced. */
const SERVER = ['data/fakeRepository.ts'];

/** Turning dollars typed in a field into cents, and cents into a label, is conversion, not a total. */
const CONVERSION = ['features/booking/money.ts', 'features/booking/offers.ts'];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '__tests__' || name === 'test-utils' ? [] : sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.(test|stories)\.tsx?$/.test(name) ? [path] : [];
  });
}

/** Code only: comments and string contents removed, so copy like "$7 fee is added" is not read as arithmetic. */
function codeOnly(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""');
}

const AMOUNT = String.raw`[\w.?!\]\[()]*(?:[cC]ents|Total|Amount|Fee|Price)\b(?:\([^()]*\))?`;

/** An amount on either side of +, - or *, or accumulated with += / -= / *=, or summed with reduce. */
const ARITHMETIC: { name: string; pattern: RegExp }[] = [
  { name: 'amount then + - *', pattern: new RegExp(String.raw`${AMOUNT}\s*(?:\+|-|\*)(?![+\-=>])=?\s*[\w(\`$]`) },
  { name: '+ - * then amount', pattern: new RegExp(String.raw`[\w)\]]\s*(?:\+|-|\*)=?\s*${AMOUNT}`) },
  { name: 'reduce over amounts', pattern: /\.reduce\([^)]*[cC]ents/ },
];

function offences(file: string): string[] {
  const lines = codeOnly(readFileSync(file, 'utf8')).split('\n');
  return lines.flatMap((line, i) =>
    ARITHMETIC.filter(({ pattern }) => pattern.test(line)).map(({ name }) => `${relative(SRC, file)}:${i + 1} (${name}): ${line.trim()}`),
  );
}

describe('no client-side totals', () => {
  const files = sourceFiles(SRC);
  const guarded = files.filter((f) => ![...SERVER, ...CONVERSION].includes(relative(SRC, f)));

  it('covers the screens, features, components and payment code', () => {
    const paths = guarded.map((f) => relative(SRC, f));
    for (const expected of [
      'features/offers/OfferReviewSheet.tsx',
      'features/offers/useOfferFlow.ts',
      'features/offers/copy.ts',
      'features/passes/usePassPurchase.ts',
      'features/passes/PassSheet.tsx',
      'features/lineup/BookingCard.tsx',
      'components/ui/MoneySummary.tsx',
      'lib/payments/TestPaymentSheet.tsx',
      'app/event/[id].tsx',
    ]) {
      expect(paths).toContain(expected);
    }
    expect(paths).not.toContain('data/fakeRepository.ts');
  });

  it('finds no arithmetic on amounts outside the fake server', () => {
    expect(guarded.flatMap(offences)).toEqual([]);
  });

  it('would catch a total worked out in a screen', () => {
    const caught = (line: string) => ARITHMETIC.some(({ pattern }) => pattern.test(codeOnly(line)));
    expect(caught('const total = offer.offerCents + SERVICE_FEE_CENTS;')).toBe(true);
    expect(caught('const total = quote.offerCents + quote.serviceFeeCents;')).toBe(true);
    expect(caught('const total = 700 + booking.offerCents;')).toBe(true);
    expect(caught('formatCents(offerCents + 700)')).toBe(true);
    expect(caught('let sum = 0; sum += line.cents;')).toBe(true);
    expect(caught('const due = type.priceCents * quantity;')).toBe(true);
    expect(caught('const left = totalCents - offerCents;')).toBe(true);
    expect(caught('lines.reduce((sum, l) => sum + l.cents, 0)')).toBe(true);
    // Showing what the server sent is fine.
    expect(caught('formatCents(booking.totalCents)')).toBe(false);
    expect(caught('const ready = offerCents != null && offerCents > 0;')).toBe(false);
    expect(caught("{ label: 'Held on your card', cents: q.totalCents }")).toBe(false);
  });

  it('keeps the service fee figure in the fake server: no screen or feature holds it as a number', () => {
    const withFigure = guarded
      .filter((f) => /\b700\b/.test(codeOnly(readFileSync(f, 'utf8'))))
      .map((f) => relative(SRC, f))
      // The parts kit shows sample amounts; it is a dev-only catalogue of components.
      .filter((f) => f !== 'app/kit.tsx');
    expect(withFigure).toEqual([]);
  });
});
