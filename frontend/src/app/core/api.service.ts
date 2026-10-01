import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dashboard, Project, ProjectInput, RunningTimer, TimeEntry } from './models';

const API = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  projects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${API}/projects`);
  }
  createProject(input: ProjectInput): Observable<Project> {
    return this.http.post<Project>(`${API}/projects`, input);
  }
  updateProject(id: number, input: ProjectInput): Observable<Project> {
    return this.http.put<Project>(`${API}/projects/${id}`, input);
  }
  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/projects/${id}`);
  }

  timer(): Observable<RunningTimer | null> {
    return this.http.get<RunningTimer | null>(`${API}/timer`);
  }
  startTimer(projectId: number): Observable<RunningTimer> {
    return this.http.post<RunningTimer>(`${API}/timer/start`, { projectId });
  }
  stopTimer(): Observable<TimeEntry> {
    return this.http.post<TimeEntry>(`${API}/timer/stop`, {});
  }

  timeEntries(): Observable<TimeEntry[]> {
    return this.http.get<TimeEntry[]>(`${API}/time-entries`);
  }
  deleteTimeEntry(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/time-entries/${id}`);
  }

  dashboard(): Observable<Dashboard> {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    return this.http.get<Dashboard>(`${API}/dashboard`, { params: { since: midnight.toISOString() } });
  }
}
