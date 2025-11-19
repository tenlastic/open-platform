import { Context } from '@tenlastic/web-server';

export type JwksContext = Context<
  unknown,
  void,
  { keys: Array<{ alg?: string; kty?: string; use?: string; x5c: string[] }> }
>;

export async function handler(ctx: JwksContext) {
  const x5c = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n')
    .replace(/\n/g, '')
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '');

  ctx.response.body = {
    keys: [{ alg: 'RS256', kty: 'RSA', use: 'sig', x5c: [x5c] }],
  };
}
