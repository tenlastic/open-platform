import * as Chance from 'chance';
import * as fs from 'fs';
import * as puppeteer from 'puppeteer';

import { step } from '../../step';
import dependencies from '../../dependencies';
import * as helpers from '../helpers';

const chance = new Chance();

describe('/angular/authentication/logins', () => {
  let browser: puppeteer.Browser;
  let page: puppeteer.Page;
  let username: string;

  before(async function () {
    // Open a new browser and load the home page.
    browser = await puppeteer.launch({ args: ['--disable-setuid-sandbox', '--no-sandbox'] });
    page = await browser.newPage();
    page.setViewport({ width: 1920, height: 1080 });
    await page.goto(process.env.E2E_WWW_URL, { waitUntil: 'networkidle0' });

    // Generate a username for the test User.
    username = chance.hash({ length: 24 });
  });

  after(async function () {
    await browser.close();

    // Delete the test User.
    if (username) {
      const users = await dependencies.userService.find({ where: { username } });
      if (users.length) {
        await dependencies.userService.delete(users[0]._id);
      }
    }
  });

  afterEach(async function () {
    fs.mkdirSync('./test-results/puppeteer', { recursive: true });
    await page.screenshot({ path: `./test-results/puppeteer/${this.currentTest.title}.png` });
  });

  step('navigates to the login page', async function () {
    const button = await helpers.getButtonByText(page, 'Log In');
    await helpers.clickAndNavigate(button, page, 'Log In | Tenlastic');
  });

  step('navigates to the registration page', async function () {
    const button = await helpers.getButtonByText(page, 'Create Account');
    await helpers.clickAndNavigate(button, page, 'Create Account | Tenlastic');
  });

  step('registers a new user', async function () {
    const usernameInput = await helpers.getInputByLabel('Username', page);
    await helpers.type(usernameInput, page, username);

    const passwordInput = await helpers.getInputByLabel('Password', page);
    await helpers.type(passwordInput, page, 'Example');

    const confirmPasswordInput = await helpers.getInputByLabel('Confirm password', page);
    await helpers.type(confirmPasswordInput, page, 'Example');

    const button = await helpers.getButtonByText(page, 'Submit');
    await helpers.clickAndNavigate(button, page, 'Home | Tenlastic');
  });

  step('logs out', async function () {
    const accountButton = await helpers.getButtonByText(page, username);
    await helpers.clickAndNavigate(accountButton, page, 'Account Information | Tenlastic');

    const logOutButton = await helpers.getButtonByText(page, 'Log Out');
    await helpers.clickAndNavigate(logOutButton, page, 'Log In | Tenlastic');
  });

  step('logs in', async function () {
    const usernameInput = await helpers.getInputByLabel('Username', page);
    await helpers.type(usernameInput, page, username);

    const passwordInput = await helpers.getInputByLabel('Password', page);
    await helpers.type(passwordInput, page, 'Example');

    const button = await helpers.getButtonByText(page, 'Submit');
    await helpers.clickAndNavigate(button, page, 'Home | Tenlastic');
  });
});
