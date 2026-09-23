import { Component, EventEmitter, Output, ChangeDetectionStrategy, input } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-dynamic-data-table',
    imports: [MatButtonModule, MatIconModule],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './dynamic-data-table.component.html'
})
export class DynamicDataTableComponent {
  readonly columns = input<string[]>([]);
  readonly rows = input<Record<string, unknown>[]>([]);
  readonly showFileAction = input(false);
  @Output() openFile = new EventEmitter<Record<string, unknown>>();

  value(row: Record<string, unknown>, column: string): string {
    const value = row[column];
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  trackByColumn(_: number, column: string): string { return column; }
}
