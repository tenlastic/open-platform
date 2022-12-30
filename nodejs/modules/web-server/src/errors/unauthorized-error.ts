export class UnauthorizedError extends Error {
  public status: number;

  constructor(message?: string) {
    super(message ?? 'Unauthorized');

    this.name = 'UnauthorizedError';
    this.status = 401;
  }
}
