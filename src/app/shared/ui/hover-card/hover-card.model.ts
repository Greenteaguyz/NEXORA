import { Game } from '../../../core/models/game.model';

export interface HoverCardPosition {
  top: number;
  left: number;
  placement: 'right' | 'left';
}

export interface HoverCardState {
  isOpen: boolean;
  game: Game | null;
  position: HoverCardPosition;
}
