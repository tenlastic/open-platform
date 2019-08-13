export class RecordNotFoundError extends Error {
  constructor() {
    super('Record not found.');
  }
}
