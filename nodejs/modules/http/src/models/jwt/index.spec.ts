import { expect } from 'chai';
import * as Chance from 'chance';
import * as jsonwebtoken from 'jsonwebtoken';

import { UserModel } from '../user';
import { Jwt } from './';

const chance = new Chance();

describe('models/jwt', function () {
  it('decodes a jwt', function () {
    const exp = new Date();
    const jti = chance.hash();
    const user = new UserModel();
    const value = jsonwebtoken.sign({ jti, user }, chance.hash(), { expiresIn: '14d' });

    const jwt = new Jwt(value);

    expect(jwt.payload.exp).to.be.greaterThan(exp);
    expect(jwt.payload.jti).to.eql(jti);
    expect(jwt.payload.user).to.eql(user);
    expect(jwt.value).to.eql(value);
  });
});
