import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../core/api.service';
import { TimeEntry } from '../../core/models';
import { TimerService } from '../../core/timer.service';
import { ToastService } from '../../core/toast.service';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { DurationPipe } from '../../shared/format.pipes';

@Component({
  selector: 'app-time-entries',
  imports: [DatePipe, DurationPipe, ConfirmDialog],
  template: `
    <header class="page-head">
      <h1>Time Entries</h1>
      <p>Everything you've tracked, newest first.</p>
    </header>

    @if (loading()) {
      <div class="state">Loading…</div>
    } @else if (error()) {
      <div class="state error">
        <p>{{ error() }}</p>
        <button class="btn" (click)="load()">Try again</button>
      </div>
    } @else if (!entries().length) {
      <div class="state"><p>No time tracked yet.</p></div>
    } @else {
      <div class="card table-wrap">
        <table>
          <thead>
            <tr><th>Project</th><th>Date</th><th>Start</th><th>End</th><th class="num">Duration</th><th></th></tr>
          </thead>
          <tbody>
            @for (e of entries(); track e.id) {
              <tr>
                <td class="strong">{{ e.projectName }}</td>
                <td>{{ e.startTime | date: 'MMM d, y' }}</td>
                <td>{{ e.startTime | date: 'h:mm a' }}</td>
                <td>{{ e.endTime | date: 'h:mm a' }}</td>
                <td class="num strong">{{ e.durationSeconds | duration }}</td>
                <td class="num"><button class="btn btn-sm btn-ghost-danger" (click)="toDelete.set(e)">Delete</button></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    @if (toDelete(); as e) {
      <app-confirm-dialog title="Delete time entry?" message="This removes the entry from your totals."
        (confirmed)="remove(e)" (cancelled)="toDelete.set(null)" />
    }
  `,
})
export class TimeEntriesPage implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  protected entries = signal<TimeEntry[]>([]);
  protected loading = signal(true);
  protected error = signal('');
  protected toDelete = signal<TimeEntry | null>(null);

  constructor() {
    inject(TimerService).changed$.pipe(takeUntilDestroyed()).subscribe(() => this.load());
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.error.set('');
    this.api.timeEntries().subscribe({
      next: (list) => {
        this.entries.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load time entries.');
        this.loading.set(false);
      },
    });
  }

  remove(e: TimeEntry) {
    this.toDelete.set(null);
    this.api.deleteTimeEntry(e.id).subscribe({
      next: () => {
        this.toast.success('Entry deleted.');
        this.load();
      },
      error: (err) => this.toast.error(err, 'Unable to delete entry.'),
    });
  }
}
