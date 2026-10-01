import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Project } from '../core/models';
import { TimerService } from '../core/timer.service';
import { ClockPipe } from './format.pipes';

@Component({
  selector: 'app-timer-card',
  imports: [FormsModule, ClockPipe],
  template: `
    @if (timer.running(); as run) {
      <section class="timer-card running" aria-live="polite">
        <div class="timer-status"><span class="pulse"></span> Timer Running · Tracking time</div>
        <h2 class="timer-project">{{ run.projectName }}</h2>
        <div class="timer-clock" role="timer">{{ timer.elapsedSeconds() | clock }}</div>
        <button class="btn btn-stop" (click)="timer.stop()" [disabled]="timer.busy()">Stop</button>
      </section>
    } @else {
      <section class="timer-card idle">
        <div class="timer-status muted">No timer running</div>
        <h2 class="timer-project">Ready when you are</h2>
        @if (projects().length) {
          <div class="timer-start">
            <label class="sr-only" for="timer-project">Project</label>
            <select id="timer-project" class="input" [ngModel]="selected()" (ngModelChange)="selected.set($event)">
              @for (p of projects(); track p.id) {
                <option [ngValue]="p.id">{{ p.name }}</option>
              }
            </select>
            <button class="btn btn-primary" (click)="start()" [disabled]="timer.busy() || !timer.loaded() || selected() === null">
              Start timer
            </button>
          </div>
        } @else {
          <p class="muted">Create your first project to start tracking time.</p>
        }
      </section>
    }
  `,
})
export class TimerCard {
  timer = inject(TimerService);
  projects = input.required<Project[]>();
  protected selected = signal<number | null>(null);

  private firstId = computed(() => this.projects()[0]?.id ?? null);

  constructor() {
    effect(() => {
      const current = this.selected();
      if (current === null || !this.projects().some((p) => p.id === current)) this.selected.set(this.firstId());
    });
  }

  start() {
    const id = this.selected();
    if (id !== null) this.timer.start(id);
  }
}
