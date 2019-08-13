import { request } from './request';

export class StubCleaner {
  public urls: string[] = [];

  public add(url: string) {
    this.urls.push(url);
  }

  public async clean() {
    for (let i = 0; i < this.urls.length; i++) {
      const url = this.urls[i];
      const user = { activatedAt: new Date(), roles: ['Admin'] };

      try {
        await request('delete', url, null, user);
      } catch {}
    }
  }
}
