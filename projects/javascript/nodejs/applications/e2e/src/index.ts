import { logIn } from './log-in';

before(async function() {
  await logIn();
});
