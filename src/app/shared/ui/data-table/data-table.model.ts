export type SortDirection = 'asc' | 'desc' | null;

export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  format?: (value: any, row: T) => string;
}

export interface TableSortState {
  column: string | null;
  direction: SortDirection;
}

export interface TablePaginationState {
  page: number;
  pageSize: number;
  total: number;
}
