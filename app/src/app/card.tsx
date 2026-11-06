import { CardView } from '@/features/card/CardView';
import { useBrightScreen } from '@/features/card/useBrightScreen';

/** My Memberly Card, from Home's pass row and Me. Brightness rises while it is open. */
export default function CardScreen() {
  useBrightScreen();
  return <CardView />;
}
