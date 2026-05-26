import { useEffect, useState } from 'react';
import type { GameState } from '../game/types';

/** Elapsed seconds for the current game, ticking only while playing. */
export function useElapsedSeconds(state: GameState): number {
  const [, force] = useState(0);
  const running = state.status === 'playing' && state.startTime != null;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => force((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [running]);

  if (state.startTime == null) return 0;
  const end = state.endTime ?? Date.now();
  return Math.floor((end - state.startTime) / 1000);
}
