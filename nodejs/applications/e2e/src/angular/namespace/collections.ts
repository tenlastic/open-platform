import * as Chance from 'chance';
import * as fs from 'fs';
import * as puppeteer from 'puppeteer';

import { step } from '../../step';
import { administratorAccessToken, administratorRefreshToken } from '../../';
import * as helpers from '../helpers';
import dependencies from '../../dependencies';

const chance = new Chance();

describe('/angular/namespace/collections', () => {
  let browser: puppeteer.Browser;
  let collection: string;
  let namespace: string;
  let page: puppeteer.Page;

  before(async function () {
    // Open a new browser and load the home page.
    browser = await puppeteer.launch({ args: ['--disable-setuid-sandbox', '--no-sandbox'] });
    page = await browser.newPage();
    page.setViewport({ width: 1920, height: 1080 });
    await helpers.setTokensOnPageLoad(administratorAccessToken, page, administratorRefreshToken);
    await page.goto('http://www.local.tenlastic.com', { waitUntil: 'networkidle0' });

    // Generate a name for the Namespace.
    collection = chance.hash();
    namespace = chance.hash();
  });

  after(async function () {
    await browser.close();

    // Delete the test Namespace.
    const namespaces = await dependencies.namespaceService.find({ where: { name: namespace } });
    if (namespaces.length) {
      await dependencies.namespaceService.delete(namespaces[0]._id);
    }
  });

  afterEach(async function () {
    fs.mkdirSync('./test-results/puppeteer', { recursive: true });
    await page.screenshot({ path: `./test-results/puppeteer/${this.currentTest.title}.png` });
  });

  step('navigates to the Namespaces page', async function () {
    const button = await helpers.getButtonByText(page, 'Management Portal');
    await helpers.clickAndNavigate(button, page, 'Namespaces | Tenlastic');
  });

  step('navigates to the New Namespace page', async function () {
    const button = await helpers.getButtonByText(page, 'New Namespace');
    await helpers.clickAndNavigate(button, page, 'New Namespace | Tenlastic');
  });

  step('creates a Namespace', async function () {
    const nameInput = await helpers.getInputByLabel('Name', page);
    await helpers.type(nameInput, page, namespace);

    const button = await helpers.getButtonByText(page, 'Save');
    await helpers.clickAndNavigate(button, page, 'Edit Namespace | Tenlastic');
  });

  step('runs the Namespace successfully', async function () {
    const criteria = [
      `.//input[@ng-reflect-value='Running']`,
      `.//mat-label[contains(., 'Phase')]`,
    ];

    await helpers.waitForXPath(page, `//mat-form-field[${criteria.join(' and ')}]`, {
      timeout: 30 * 1000,
    });
  });

  step('navigates to the Collections page', async function () {
    const button = await helpers.getButtonByText(page, 'Collections');
    await helpers.clickAndNavigate(button, page, 'Collections | Tenlastic');
  });

  step('navigates to the New Collection page', async function () {
    const button = await helpers.getButtonByText(page, 'New Collection');
    await helpers.clickAndNavigate(button, page, 'New Collection | Tenlastic');
  });

  step('creates a Collection', async function () {
    const nameInput = await helpers.getInputByLabel('Name', page);
    await helpers.type(nameInput, page, collection);

    const keyInput = await helpers.getInputByLabel('Key', page);
    await helpers.type(keyInput, page, 'name');

    const typeDropdown = await helpers.getDropdownByLabel('Type', page);
    await typeDropdown.click();

    const stringOption = await helpers.getElementByXPath(
      page,
      `//mat-option[span[contains(text(), 'String')]]`,
    );
    await stringOption.click();

    await helpers.sleep(1000);

    const button = await helpers.getButtonByText(page, 'Save');
    await helpers.clickAndNavigate(button, page, 'Edit Collection | Tenlastic');
  });

  step('navigates to the Records page', async function () {
    const button = await helpers.getButtonByText(page, 'Records');
    await helpers.clickAndNavigate(button, page, 'Records | Tenlastic');
  });

  step('navigates to the New Record page', async function () {
    const button = await helpers.getButtonByText(page, 'New Record');
    await helpers.clickAndNavigate(button, page, 'New Record | Tenlastic');
  });

  step('creates a Record', async function () {
    const nameInput = await helpers.getInputByLabel('Name', page);
    await helpers.type(nameInput, page, collection);

    const button = await helpers.getButtonByText(page, 'Save');
    await helpers.clickAndNavigate(button, page, 'Edit Record | Tenlastic');
  });
});
