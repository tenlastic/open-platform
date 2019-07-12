import { expect } from 'chai';

import { UserMock } from '../../models';
import { logIn } from './log-in';

describe.only('common/log-in', function() {
  it('returns the expected attributes', async function() {
    const user = await UserMock.create();

    const result = await logIn(user);

    expect(result.accessToken).to.exist;
    expect(result.refreshToken).to.exist;
    expect(result.user.lastLoginAt).to.exist;
  });
});
