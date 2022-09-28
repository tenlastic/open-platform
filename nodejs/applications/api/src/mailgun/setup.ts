import mailgun from '@tenlastic/mailgun';

export interface SetupOptions {
  domain: string;
  secret: string;
}

export function setup(options: SetupOptions) {
  mailgun.setCredentials(options.domain, options.secret);
}
