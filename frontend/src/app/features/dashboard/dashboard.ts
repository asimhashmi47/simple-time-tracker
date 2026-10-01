import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../core/api.service';
import { Dashboard, Project } from '../../core/models';
import { TimerService } from '../../core/timer.service';
import { ToastService } from '../../core/toast.service';
import { DurationPipe } from '../../shared/format.pipes';
import { TimerCard } from '../../shared/timer-card';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, DurationPipe, RouterLink, TimerCard],
  template: `
    <header class="page-head">
      <h1>Dashboard</h1>
      <p>Your tracked time at a glance.</p>
    </header>

    @if (error()) {
      <div class="state error">
        <p>{{ error() }}</p>
        <button class="btn" (click)="load()">Try again</button>
      </div>
    } @else if (!data()) {
      <div class="state">Loading…</div>
    } @else {
      <app-timer-card [projects]="projects()" />

      <div class="stats">
        <div class="card stat">
          <span class="stat-label">Total tracked</span>
          <strong>{{ data()!.totalSeconds | duration }}</strong>
        </div>
        <div class="card stat">
          <span class="stat-label">Today</span>
          <strong>{{ data()!.todaySeconds | duration }}</strong>
        </div>
        <div class="card stat">
          <span class="stat-label">Projects</span>
          <strong>{{ data()!.projectCount }}</strong>
        </div>
        <div class="card stat" [class.stat-live]="timer.running()">
          <span class="stat-label">Current timer</span>
          <strong>{{ timer.running() ? timer.running()!.projectName : 'Idle' }}</strong>
        </div>
      </div>

      <div class="two-col">
        <section class="card">
          <h2>Project hours</h2>
          @if (!data()!.projects.length) {
            <p class="muted">Create your first project to start tracking time.</p>
            <a routerLink="/projects" class="btn btn-primary">Create project</a>
          } @else {
            <ul class="list">
              @for (p of data()!.projects; track p.id) {
                <li>
                  <span class="truncate">{{ p.name }}</span>
                  <strong>{{ p.totalSeconds | duration }}</strong>
                </li>
              }
            </ul>
          }
        </section>

        <section class="card">
          <h2>Recent entries</h2>
          @if (!data()!.recentEntries.length) {
            <p class="muted">No time tracked yet.</p>
          } @else {
            <ul class="list">
              @for (e of data()!.recentEntries; track e.id) {
                <li>
                  <span class="truncate">
                    {{ e.projectName }}
                    <small class="muted">{{ e.startTime | date: 'MMM d, h:mm a' }}</small>
                  </span>
                  <strong>{{ e.durationSeconds | duration }}</strong>
                </li>
              }
            </ul>
          }
        </section>
      </div>
    }
  `,
})
export class DashboardPage implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  protected timer = inject(TimerService);

  protected data = signal<Dashboard | null>(null);
  protected projects = signal<Project[]>([]);
  protected error = signal('');

  constructor() {
    this.timer.changed$.pipe(takeUntilDestroyed()).subscribe(() => this.load());
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.error.set('');
    this.api.dashboard().subscribe({
      next: (d) => this.data.set(d),
      error: (e) => this.error.set(this.messageFor(e)),
    });
    this.api.projects().subscribe({
      next: (p) => this.projects.set(p),
      error: (e) => this.toast.error(e),
    });
  }

  private messageFor(e: unknown) {
    return (e as { status?: number })?.status === 0
      ? 'Cannot reach the server. Is the backend running?'
      : 'Could not load the dashboard.';
  }
}
