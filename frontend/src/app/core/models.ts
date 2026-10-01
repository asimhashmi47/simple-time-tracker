export interface Project {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  totalSeconds: number;
}

export interface ProjectInput {
  name: string;
  description: string;
}

export interface RunningTimer {
  id: number;
  projectId: number;
  projectName: string;
  startTime: string;
}

export interface TimeEntry {
  id: number;
  projectId: number;
  projectName: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
}

export interface Dashboard {
  totalSeconds: number;
  todaySeconds: number;
  projectCount: number;
  projects: { id: number; name: string; totalSeconds: number }[];
  recentEntries: Omit<TimeEntry, 'projectId'>[];
}
