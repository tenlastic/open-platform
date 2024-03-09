import { expect } from 'chai';
import * as nock from 'nock';

import { request } from './';

describe('request', function () {
  it('sends a request', async function () {
    nock('https://www.example.com').get('/').reply(200);

    const response = await request({ method: 'get', url: 'https://www.example.com' });

    expect(response.status).to.eql(200);
  });
});
