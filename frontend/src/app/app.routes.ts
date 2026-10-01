import { Routes } from '@angular/router';
import { DashboardPage } from './features/dashboard/dashboard';
import { ProjectsPage } from './features/projects/projects';
import { TimeEntriesPage } from './features/time-entries/time-entries';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: DashboardPage },
  { path: 'projects', component: ProjectsPage },
  { path: 'time-entries', component: TimeEntriesPage },
  { path: '**', redirectTo: 'dashboard' },
];
