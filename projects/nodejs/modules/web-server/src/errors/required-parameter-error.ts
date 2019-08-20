export class RequiredFieldError extends Error {
  constructor(parameters: string[]) {
    if (parameters.length === 1) {
      super(`Missing required field: ${parameters[0]}.`);
    } else if (parameters.length === 2) {
      super(`Missing required fields: ${parameters[0]} and ${parameters[1]}.`);
    } else {
      const list = parameters.slice(0, -1).join(', ');
      super(`Missing required fields: ${list}, and ${parameters[parameters.length - 1]}.`);
    }

    this.name = 'RequiredFieldError';
  }
}
