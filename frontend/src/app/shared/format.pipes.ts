import { Pipe, PipeTransform } from '@angular/core';

/** 4510 -> "1h 15m"; under a minute -> "45s". */
@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
  transform(seconds: number | null | undefined): string {
    const s = Math.max(0, Math.round(seconds ?? 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h) return `${h}h ${m}m`;
    if (m) return `${m}m`;
    return `${s}s`;
  }
}

/** 4510 -> "01:15:10" for the live clock. */
@Pipe({ name: 'clock' })
export class ClockPipe implements PipeTransform {
  transform(seconds: number): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
  }
}
