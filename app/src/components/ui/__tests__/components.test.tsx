import { fireEvent, render, screen } from '@testing-library/react-native';

import { BOOKING_STATUSES, statusUi } from '@/features/booking/status';

import { Button } from '../Button';
import { MoneySummary } from '../MoneySummary';
import { StatusPill } from '../StatusPill';

describe('StatusPill', () => {
  it.each(BOOKING_STATUSES)('renders the agreed label for %s', async (status) => {
    await render(<StatusPill status={status} />);
    expect(screen.getByText(statusUi(status).label)).toBeTruthy();
  });
});

describe('Button', () => {
  it('fires onPress when enabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Pay now" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Pay now' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Send 2 offers" onPress={onPress} disabled />);
    await fireEvent.press(screen.getByRole('button', { name: 'Send 2 offers' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('MoneySummary', () => {
  it('shows the total it is given and does not add the lines up', async () => {
    // Staging returns $470.96 for a $450 offer until GEL-802 ships: the app must show it as sent.
    await render(
      <MoneySummary
        lines={[
          { label: 'KOYO’s fee', cents: 45000 },
          { label: 'Gelatin service fee', cents: 700 },
        ]}
        total={{ label: 'Held on your card', cents: 47096 }}
      />,
    );
    expect(screen.getByTestId('money-total')).toHaveTextContent('$470.96');
    expect(screen.queryByText('$457.00')).toBeNull();
    expect(screen.getByText('$450.00')).toBeTruthy();
    expect(screen.getByText('$7.00')).toBeTruthy();
  });
});
