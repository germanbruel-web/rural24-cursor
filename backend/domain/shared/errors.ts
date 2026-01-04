/**
 * Base Error Classes
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly fields?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class DatabaseError extends DomainError {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}
