export class ContentError extends Error {
  readonly operation: string;
  readonly code: string | null;

  constructor(operation: string, message: string, code: string | null = null) {
    super(`[${operation}] ${message}`);
    this.name = 'ContentError';
    this.operation = operation;
    this.code = code;
  }
}
