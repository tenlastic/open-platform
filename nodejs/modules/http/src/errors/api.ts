import { AxiosError } from 'axios';

export class ApiError extends Error {
  public errors = [];
  public messages: string[] = [];
  public method = 'get';
  public status = 500;
  public url: string;

  constructor(err: AxiosError) {
    super();

    this.errors = err.response ? [err.response.data as any] : [];
    if (typeof err.response?.data === 'string') {
      try {
        this.errors = JSON.parse(err.response.data).errors;
      } catch {}
    }
    this.messages = this.errors.map((e) => e?.message);
    this.method = err.config.method?.toUpperCase();
    this.status = err.response?.status;
    this.url = err.config?.url;

    this.message =
      `${this.method} to ${this.url} responded with ${this.status}: ` + this.messages.join(', ');
  }
}
