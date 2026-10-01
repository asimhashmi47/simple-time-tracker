import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Project } from '../../core/models';
import { TimerService } from '../../core/timer.service';
import { ToastService } from '../../core/toast.service';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { DurationPipe } from '../../shared/format.pipes';

@Component({
  selector: 'app-projects',
  imports: [DatePipe, DurationPipe, FormsModule, ConfirmDialog],
  template: `
    <header class="page-head with-action">
      <div>
        <h1>Projects</h1>
        <p>Create projects and start tracking time against them.</p>
      </div>
      @if (!formOpen()) {
        <button class="btn btn-primary" (click)="openForm()">New project</button>
      }
    </header>

    @if (formOpen()) {
      <form class="card form" (ngSubmit)="save()" #f="ngForm">
        <h2>{{ editingId() ? 'Edit project' : 'New project' }}</h2>
        <label for="p-name">Name</label>
        <input id="p-name" name="name" class="input" [(ngModel)]="name" required maxlength="100" autocomplete="off" />
        <label for="p-desc">Description <span class="muted">(optional)</span></label>
        <textarea id="p-desc" name="description" class="input" rows="2" [(ngModel)]="description" maxlength="500"></textarea>
        <div class="form-actions">
          <button type="button" class="btn" (click)="closeForm()">Cancel</button>
          <button type="submit" class="btn btn-primary" [disabled]="!name.trim() || saving()">
            {{ editingId() ? 'Save changes' : 'Create project' }}
          </button>
        </div>
      </form>
    }

    @if (loading()) {
      <div class="state">Loading…</div>
    } @else if (error()) {
      <div class="state error">
        <p>{{ error() }}</p>
        <button class="btn" (click)="load()">Try again</button>
      </div>
    } @else if (!projects().length) {
      <div class="state">
        <p>Create your first project to start tracking time.</p>
      </div>
    } @else {
      <div class="project-grid">
        @for (p of projects(); track p.id) {
          <article class="card project">
            <div class="project-top">
              <h3 class="truncate">{{ p.name }}</h3>
              @if (timer.running()?.projectId === p.id) {
                <span class="badge badge-live">Tracking</span>
              }
            </div>
            <p class="muted project-desc">{{ p.description || 'No description' }}</p>
            <div class="project-meta">
              <strong>{{ p.totalSeconds | duration }}</strong>
              <small class="muted">Created {{ p.createdAt | date: 'MMM d, y' }}</small>
            </div>
            <div class="project-actions">
              <button class="btn btn-primary btn-sm" (click)="timer.start(p.id)" [disabled]="!!timer.running() || timer.busy()"
                [title]="timer.running() ? 'Stop the running timer first' : ''">Start</button>
              <button class="btn btn-sm" (click)="openForm(p)">Edit</button>
              <button class="btn btn-sm btn-ghost-danger" (click)="toDelete.set(p)">Delete</button>
            </div>
          </article>
        }
      </div>
    }

    @if (toDelete(); as p) {
      <app-confirm-dialog title="Delete project?" [message]="'“' + p.name + '” and all of its time entries will be removed.'"
        (confirmed)="remove(p)" (cancelled)="toDelete.set(null)" />
    }
  `,
})
export class ProjectsPage implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  protected timer = inject(TimerService);

  protected projects = signal<Project[]>([]);
  protected loading = signal(true);
  protected error = signal('');
  protected formOpen = signal(false);
  protected editingId = signal<number | null>(null);
  protected saving = signal(false);
  protected toDelete = signal<Project | null>(null);
  protected name = '';
  protected description = '';

  ngOnInit() {
    this.load();
  }

  load() {
    this.error.set('');
    this.api.projects().subscribe({
      next: (p) => {
        this.projects.set(p);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load projects.');
        this.loading.set(false);
      },
    });
  }

  openForm(p?: Project) {
    this.editingId.set(p?.id ?? null);
    this.name = p?.name ?? '';
    this.description = p?.description ?? '';
    this.formOpen.set(true);
  }

  closeForm() {
    this.formOpen.set(false);
  }

  save() {
    if (!this.name.trim() || this.saving()) return;
    const input = { name: this.name, description: this.description };
    const id = this.editingId();
    this.saving.set(true);
    (id ? this.api.updateProject(id, input) : this.api.createProject(input)).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(id ? 'Project updated.' : 'Project created.');
        this.closeForm();
        this.load();
        if (id) this.timer.refresh();
      },
      error: (e) => {
        this.saving.set(false);
        this.toast.error(e, 'Unable to save project.');
      },
    });
  }

  remove(p: Project) {
    this.toDelete.set(null);
    this.api.deleteProject(p.id).subscribe({
      next: () => {
        this.toast.success('Project deleted.');
        this.load();
        this.timer.refresh();
      },
      error: (e) => this.toast.error(e, 'Unable to delete project.'),
    });
  }
}
