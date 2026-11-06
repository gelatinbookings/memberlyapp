// expo-network's jest mock has no listener; tests are online unless they say otherwise.
jest.mock('@/lib/network', () => ({ useOnline: jest.fn(() => true) }));

// expo-video has no native player in Jest. A stand-in player records what the screen asks of it.
jest.mock('expo-video', () => {
  const React = require('react');
  const { View } = require('react-native');
  const players = [];
  const useVideoPlayer = jest.fn((source, setup) => {
    const ref = React.useRef(null);
    if (!ref.current) {
      const player = {
        source,
        loop: false,
        muted: false,
        audioMixingMode: 'auto',
        status: 'idle',
        playing: false,
        play: jest.fn(function () {
          this.playing = true;
        }),
        pause: jest.fn(function () {
          this.playing = false;
        }),
        addListener: jest.fn(() => ({ remove: jest.fn() })),
        removeAllListeners: jest.fn(),
      };
      setup?.(player);
      players.push(player);
      ref.current = player;
    }
    return ref.current;
  });
  const VideoView = (props) => React.createElement(View, { testID: props.testID });
  return { useVideoPlayer, VideoView, __players: players };
});
