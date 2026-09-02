export interface ContextMenuItem {
  id: string;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  action: () => void;
}

export interface ContextMenuPosition {
  top: number;
  left: number;
}
