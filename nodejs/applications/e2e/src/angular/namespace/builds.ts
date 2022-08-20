import { expect } from 'chai';
import * as Chance from 'chance';
import * as fs from 'fs';
import * as puppeteer from 'puppeteer';

import { step } from '../../step';
import { administratorAccessToken, administratorRefreshToken } from '../../';
import * as helpers from '../helpers';
import dependencies from '../../dependencies';

const chance = new Chance();

describe('/angular/namespace/builds', () => {
  let browser: puppeteer.Browser;
  let build: string;
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
    build = chance.hash();
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

  step('navigates to the namespaces page', async function () {
    const button = await helpers.getButtonByText(page, 'Management Portal');
    await helpers.click(button, page);

    const title = await page.title();
    expect(title).to.equal('Namespaces | Tenlastic');
  });

  step('navigates to the create namespace page', async function () {
    const button = await helpers.getButtonByText(page, 'New Namespace');
    await helpers.click(button, page);

    const title = await page.title();
    expect(title).to.equal('New Namespace | Tenlastic');
  });

  step('creates a namespace', async function () {
    const nameInput = await helpers.getInputByLabel('Name', page);
    await helpers.type(nameInput, page, namespace);

    const button = await helpers.getButtonByText(page, 'Save');
    await helpers.click(button, page);

    const title = await page.title();
    expect(title).to.equal('Edit Namespace | Tenlastic');
  });

  step('navigates to the builds page', async function () {
    const button = await helpers.getButtonByText(page, 'Builds');
    await helpers.click(button, page);

    const title = await page.title();
    expect(title).to.equal('Builds | Tenlastic');
  });

  step('navigates to the new build page', async function () {
    const button = await helpers.getButtonByText(page, 'New Build');
    await helpers.click(button, page);

    const title = await page.title();
    expect(title).to.equal('New Build | Tenlastic');
  });

  step('creates a build', async function () {
    const nameInput = await helpers.getInputByLabel('Name', page);
    await helpers.type(nameInput, page, build);

    const selectFileFromComputerButton = await helpers.getButtonByText(
      page,
      'Select Files from Computer',
    );
    const [fileChooser] = await Promise.all([
      page.waitForFileChooser(),
      selectFileFromComputerButton.click(),
    ]);
    await fileChooser.accept(['./src/fixtures/Dockerfile']);

    const dockerfileInput = await helpers.getInputByLabel('Dockerfile', page);
    await helpers.type(dockerfileInput, page, 'Dockerfile');

    await helpers.sleep(250);

    const button = await helpers.getButtonByText(page, 'Save');
    await helpers.click(button, page);

    await page.waitForXPath(`//app-title[contains(text(), 'Edit Build')]`, { timeout: 2500 });

    const title = await page.title();
    expect(title).to.equal('Edit Build | Tenlastic');
  });

  step('finishes the build successfully', async function () {
    await page.waitForXPath(
      `//app-build-status-node[contains(div, 'Workflow') and contains(div, 'Succeeded')]`,
      { timeout: 60 * 1000 },
    );
  });

  step('generates logs', async function () {
    const button = await helpers.getButtonByText(page, 'Logs');
    await button.click();

    await page.waitForXPath(
      `//app-logs-dialog//span[contains(., 'Downloading file: Dockerfile.')]`,
      { timeout: 2500 },
    );
  });
});
