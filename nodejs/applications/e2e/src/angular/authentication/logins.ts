import wait from '@tenlastic/wait';
import * as Chance from 'chance';
import * as puppeteer from 'puppeteer';

import * as helpers from '../helpers';

const chance = new Chance();

describe('/angular/authentication/logins', () => {
  let page: puppeteer.Page;
  let username: string;

  beforeEach(async function () {
    page = await helpers.newPage();
    username = chance.hash({ length: 24 });
  });

  afterEach(async function () {
    await helpers.screenshot(`authentication`, page);

    const browser = page.browser();
    await browser.close();

    await wait(1 * 1000, 15 * 1000, () => helpers.deleteUser(username));
  });

  it('registers a new User, logs out, and logs in', async function () {
    // Navigate to the "Registration" page.
    const logInButton = await helpers.getButtonByText(page, 'Log In');
    await helpers.clickAndNavigate(logInButton, page, 'Log In | Tenlastic');

    const createAccountButton = await helpers.getButtonByText(page, 'Create Account');
    await helpers.clickAndNavigate(createAccountButton, page, 'Create Account | Tenlastic');

    // Register a new User.
    const registrationUsernameInput = await helpers.getInputByLabel('Username', page);
    await helpers.type(registrationUsernameInput, page, username);

    const registrationPasswordInput = await helpers.getInputByLabel('Password', page);
    await helpers.type(registrationPasswordInput, page, 'Example');

    const confirmPasswordInput = await helpers.getInputByLabel('Confirm password', page);
    await helpers.type(confirmPasswordInput, page, 'Example');

    const registrationSubmitButton = await helpers.getButtonByText(page, 'Submit');
    await helpers.clickAndNavigate(registrationSubmitButton, page, 'Home | Tenlastic');

    // Log out.
    const accountButton = await helpers.getButtonByText(page, username);
    await helpers.clickAndNavigate(accountButton, page, 'Account Information | Tenlastic');

    const logOutButton = await helpers.getButtonByText(page, 'Log Out');
    await helpers.clickAndNavigate(logOutButton, page, 'Log In | Tenlastic');

    // Log in.
    const loginUsernameInput = await helpers.getInputByLabel('Username', page);
    await helpers.type(loginUsernameInput, page, username);

    const loginPasswordInput = await helpers.getInputByLabel('Password', page);
    await helpers.type(loginPasswordInput, page, 'Example');

    const loginSubmitButton = await helpers.getButtonByText(page, 'Submit');
    await helpers.clickAndNavigate(loginSubmitButton, page, 'Home | Tenlastic');
  });
});
