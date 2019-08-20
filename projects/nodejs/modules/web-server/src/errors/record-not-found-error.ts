export class RecordNotFoundError extends Error {
  constructor(name?: string) {
    super(`${name ? name : 'Record'} not found.`);

    this.name = 'RecordNotFoundError';
  }
}
