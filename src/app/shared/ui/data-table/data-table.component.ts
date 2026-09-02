import {
  Component,
  input,
  signal,
  computed,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ContentChild,
  TemplateRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableColumn, TableSortState, SortDirection } from './data-table.model';
import { filterTableData, sortTableData, paginateTableData } from './data-table.util';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableComponent<T extends Record<string, any>> {
  data = input<T[]>([]);
  columns = input<TableColumn<T>[]>([]);
  searchable = input<boolean>(true);
  searchPlaceholder = input<string>('Search table...');
  searchKeys = input<(keyof T | string)[]>([]);
  pageSize = input<number>(10);
  emptyMessage = input<string>('No records matching your search.');

  @Output() rowClick = new EventEmitter<T>();

  @ContentChild('rowActions', { static: false }) rowActionsTemplate?: TemplateRef<{ $implicit: T }>;

  searchQuery = signal<string>('');
  sortState = signal<TableSortState>({ column: null, direction: null });
  currentPage = signal<number>(1);

  filteredData = computed(() => {
    return filterTableData(this.data(), this.searchQuery(), this.searchKeys());
  });

  sortedData = computed(() => {
    return sortTableData(this.filteredData(), this.sortState().column, this.sortState().direction);
  });

  totalPages = computed(() => {
    const total = this.sortedData().length;
    return Math.max(1, Math.ceil(total / Math.max(1, this.pageSize())));
  });

  paginatedData = computed(() => {
    return paginateTableData(this.sortedData(), this.currentPage(), this.pageSize());
  });

  startIndex = computed(() => {
    const count = this.sortedData().length;
    if (count === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  endIndex = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.sortedData().length);
  });

  onSearchChange(val: string): void {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  onSort(col: TableColumn<T>): void {
    if (!col.sortable) return;

    const current = this.sortState();
    let nextDir: SortDirection = 'asc';

    if (current.column === col.key) {
      if (current.direction === 'asc') nextDir = 'desc';
      else if (current.direction === 'desc') nextDir = null;
    }

    this.sortState.set({
      column: nextDir ? col.key : null,
      direction: nextDir
    });
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  formatCell(row: T, col: TableColumn<T>): string {
    const val = row[col.key];
    if (col.format) {
      return col.format(val, row);
    }
    return val != null ? String(val) : '—';
  }
}
