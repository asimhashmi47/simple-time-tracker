import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TimerService } from './core/timer.service';
import { ToastService } from './core/toast.service';
import { ClockPipe } from './shared/format.pipes';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ClockPipe],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <a class="brand" routerLink="/">
          <span class="brand-mark">S</span>
          <span class="brand-name">SimpleTimeTracker</span>
        </a>
        <nav aria-label="Main">
          <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/projects" routerLinkActive="active">Projects</a>
          <a routerLink="/time-entries" routerLinkActive="active">Time Entries</a>
        </nav>
        @if (timer.running(); as run) {
          <a class="mini-timer" routerLink="/dashboard">
            <span class="pulse"></span>
            <span class="truncate">{{ run.projectName }}</span>
            <strong>{{ timer.elapsedSeconds() | clock }}</strong>
          </a>
        }
        <p class="sidebar-foot">Track time. Stay honest.</p>
      </aside>
      <main class="content"><router-outlet /></main>
    </div>

    <div class="toasts" aria-live="polite">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class.toast-error]="t.kind === 'error'" (click)="toast.dismiss(t.id)">{{ t.text }}</div>
      }
    </div>
  `,
})
export class App {
  protected timer = inject(TimerService);
  protected toast = inject(ToastService);
}
