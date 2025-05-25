import type { GameMode } from '../types/pool';
import sandboxIcon from '../assets/sandbox_icon.svg';
import golfFlagIcon from '../assets/golf_flag_mound_icon.svg';

interface GameModeIconProps {
  mode: GameMode;
  className?: string;
}

export function GameModeIcon({ mode, className = '' }: GameModeIconProps) {
  return (
    <img
      src={mode === 'normal' ? sandboxIcon : golfFlagIcon}
      alt={mode === 'normal' ? 'Sandbox Mode' : 'Golf Mode'}
      className={`mode-icon ${className}`}
      width="24"
      height="24"
    />
  );
}
