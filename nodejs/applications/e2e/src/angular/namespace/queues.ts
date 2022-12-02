import * as Chance from 'chance';
import * as fs from 'fs';
import * as puppeteer from 'puppeteer';

import dependencies from '../../dependencies';
import { step } from '../../step';
import { administratorAccessToken, administratorRefreshToken } from '../../';
import * as helpers from '../helpers';

const chance = new Chance();

describe('/angular/namespace/queues', () => {
  let browser: puppeteer.Browser;
  let build: string;
  let namespace: string;
  let page: puppeteer.Page;
  let queue: string;

  before(async function () {
    // Open a new browser and load the home page.
    browser = await puppeteer.launch({ args: ['--disable-setuid-sandbox', '--no-sandbox'] });
    page = await browser.newPage();
    page.setViewport({ width: 1920, height: 1080 });
    await helpers.setTokensOnPageLoad(administratorAccessToken, page, administratorRefreshToken);
    await page.goto('http://www.local.tenlastic.com', { waitUntil: 'networkidle0' });

    // Generate a name for the Namespace.
    build = chance.hash({ length: 64 });
    namespace = chance.hash({ length: 64 });
    queue = chance.hash({ length: 64 });
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
    const bandwidthInput = await helpers.getInputByLabel('Bandwidth', page);
    await helpers.type(bandwidthInput, page, `${1 * 1000 * 1000 * 1000}`);

    const cpuInput = await helpers.getInputByLabel('CPU', page);
    await helpers.type(cpuInput, page, `${1}`);

    const memoryInput = await helpers.getInputByLabel('Memory', page);
    await helpers.type(memoryInput, page, `${1 * 1000 * 1000 * 1000}`);

    const nameInput = await helpers.getInputByLabel('Name', page);
    await helpers.type(nameInput, page, namespace);

    const storageInput = await helpers.getInputByLabel('Storage', page);
    await helpers.type(storageInput, page, `${10 * 1000 * 1000 * 1000}`);

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

  step('navigates to the Builds page', async function () {
    const button = await helpers.getButtonByText(page, 'Builds');
    await helpers.clickAndNavigate(button, page, 'Builds | Tenlastic');
  });

  step('navigates to the New Build page', async function () {
    const button = await helpers.getButtonByText(page, 'New Build');
    await helpers.clickAndNavigate(button, page, 'New Build | Tenlastic');
  });

  step('creates a Build', async function () {
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
    await fileChooser.accept(['./fixtures/Dockerfile']);

    const dockerfileListItem = await helpers.getElementByXPath(
      page,
      `//div[contains(text(), 'Dockerfile')]`,
    );
    await dockerfileListItem.click();

    await helpers.sleep(1000);

    const button = await helpers.getButtonByText(page, 'Save');
    await helpers.clickAndNavigate(button, page, 'Edit Build | Tenlastic');
  });

  step('finishes the Build successfully', async function () {
    await helpers.waitForXPath(
      page,
      `//app-build-status-node[contains(div, 'Workflow') and contains(div, 'Succeeded')]`,
      { timeout: 120 * 1000 },
    );
  });

  step('publishes the Build', async function () {
    const button = await helpers.getButtonByText(page, 'Builds');
    await helpers.clickAndNavigate(button, page, 'Builds | Tenlastic');

    const publishButton = await helpers.getButtonByIcon('visibility', page);
    await publishButton.click();
  });

  step('navigates to the Queues page', async function () {
    const button = await helpers.getButtonByText(page, 'Queues');
    await helpers.clickAndNavigate(button, page, 'Queues | Tenlastic');
  });

  step('navigates to the New Queue page', async function () {
    const button = await helpers.getButtonByText(page, 'New Queue');
    await helpers.clickAndNavigate(button, page, 'New Queue | Tenlastic');
  });

  step('creates a Queue', async function () {
    const nameInput = await helpers.getInputByLabel('Name', page);
    await helpers.type(nameInput, page, queue);

    const button = await helpers.getButtonByText(page, 'Save');
    await helpers.clickAndNavigate(button, page, 'Edit Queue | Tenlastic');
  });

  step('runs the Queue successfully', async function () {
    const criteria = [
      `.//input[@ng-reflect-value='Running']`,
      `.//mat-label[contains(., 'Phase')]`,
    ];

    await helpers.waitForXPath(page, `//mat-form-field[${criteria.join(' and ')}]`, {
      timeout: 60 * 1000,
    });
  });

  step('generates logs', async function () {
    const button = await helpers.getButtonByText(page, 'Queues');
    await helpers.clickAndNavigate(button, page, 'Queues | Tenlastic');

    const logsButton = await helpers.getButtonByIcon('subject', page);
    await logsButton.click();

    await helpers.waitForXPath(
      page,
      `//app-logs-dialog//div[contains(., 'Koa server running on port 3000.')]`,
      { timeout: 2500 },
    );
  });
});
