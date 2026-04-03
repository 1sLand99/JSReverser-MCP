export type DiagnosticStatus = 'ok' | 'warn' | 'fail';

export interface DiagnosticCheck {
  name: string;
  status: DiagnosticStatus;
  reason: string;
  fix: string;
  details?: Record<string, unknown>;
}

export interface DiagnosticReport {
  status: DiagnosticStatus;
  summary: string;
  checks: DiagnosticCheck[];
}
