import { Injectable, computed, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { ApiService } from './api.service';
import { RunningTimer } from './models';
import { ToastService } from './toast.service';

/** Holds the running timer. Elapsed time is derived from the stored start timestamp, never counted up. */
@Injectable({ providedIn: 'root' })
export class TimerService {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly running = signal<RunningTimer | null>(null);
  readonly loaded = signal(false);
  readonly busy = signal(false);
  private readonly now = signal(Date.now());
  private tick?: ReturnType<typeof setInterval>;

  /** Emits after a timer starts or stops so pages can refresh their data. */
  readonly changed$ = new Subject<void>();

  readonly elapsedSeconds = computed(() => {
    const t = this.running();
    return t ? Math.max(0, Math.floor((this.now() - Date.parse(t.startTime)) / 1000)) : 0;
  });

  constructor() {
    this.api.timer().subscribe({
      next: (t) => {
        this.setRunning(t);
        this.loaded.set(true);
      },
      error: (e) => {
        this.loaded.set(true);
        this.toast.error(e, 'Could not reach the server.');
      },
    });
  }

  start(projectId: number) {
    this.busy.set(true);
    this.api.startTimer(projectId).subscribe({
      next: (t) => {
        this.busy.set(false);
        this.setRunning(t);
        this.changed$.next();
      },
      error: (e) => {
        this.busy.set(false);
        this.toast.error(e, 'Unable to start timer.');
        this.api.timer().subscribe((t) => this.setRunning(t));
      },
    });
  }

  stop() {
    this.busy.set(true);
    this.api.stopTimer().subscribe({
      next: () => {
        this.busy.set(false);
        this.setRunning(null);
        this.toast.success('Time entry saved.');
        this.changed$.next();
      },
      error: (e) => {
        this.busy.set(false);
        this.toast.error(e, 'Unable to stop timer.');
        this.api.timer().subscribe((t) => this.setRunning(t));
      },
    });
  }

  /** Called when the running project is deleted elsewhere. */
  refresh() {
    this.api.timer().subscribe((t) => this.setRunning(t));
  }

  private setRunning(t: RunningTimer | null) {
    this.running.set(t);
    clearInterval(this.tick);
    if (t) {
      this.now.set(Date.now());
      this.tick = setInterval(() => this.now.set(Date.now()), 1000);
    }
  }
}
