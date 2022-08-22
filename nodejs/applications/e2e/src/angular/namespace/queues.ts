import { expect } from 'chai';
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
    build = chance.hash();
    queue = chance.hash();
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
    await helpers.click(button, page);

    const title = await page.title();
    expect(title).to.equal('Namespaces | Tenlastic');
  });

  step('navigates to the New Namespace page', async function () {
    const button = await helpers.getButtonByText(page, 'New Namespace');
    await helpers.click(button, page);

    const title = await page.title();
    expect(title).to.equal('New Namespace | Tenlastic');
  });

  step('creates a Namespace', async function () {
    const nameInput = await helpers.getInputByLabel('Name', page);
    await helpers.type(nameInput, page, namespace);

    const button = await helpers.getButtonByText(page, 'Save');
    await helpers.click(button, page);

    const title = await page.title();
    expect(title).to.equal('Edit Namespace | Tenlastic');
  });

  step('navigates to the Builds page', async function () {
    const button = await helpers.getButtonByText(page, 'Builds');
    await helpers.click(button, page);

    const title = await page.title();
    expect(title).to.equal('Builds | Tenlastic');
  });

  step('navigates to the New Build page', async function () {
    const button = await helpers.getButtonByText(page, 'New Build');
    await helpers.click(button, page);

    const title = await page.title();
    expect(title).to.equal('New Build | Tenlastic');
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
      `//span[contains(text(), 'Dockerfile')]`,
    );
    await dockerfileListItem.click();

    await helpers.sleep(250);

    const button = await helpers.getButtonByText(page, 'Save');
    await helpers.click(button, page);

    await page.waitForXPath(`//app-title[contains(text(), 'Edit Build')]`, { timeout: 2500 });

    const title = await page.title();
    expect(title).to.equal('Edit Build | Tenlastic');
  });

  step('finishes the Build successfully', async function () {
    await page.waitForXPath(
      `//app-build-status-node[contains(div, 'Workflow') and contains(div, 'Succeeded')]`,
      { timeout: 120 * 1000 },
    );
  });

  step('publishes the Build', async function () {
    const button = await helpers.getButtonByText(page, 'Builds');
    await helpers.click(button, page);

    const title = await page.title();
    expect(title).to.equal('Builds | Tenlastic');

    const publishButton = await helpers.getButtonByIcon('visibility', page);
    await publishButton.click();
  });

  step('navigates to the Queues page', async function () {
    const button = await helpers.getButtonByText(page, 'Queues');
    await helpers.click(button, page);

    const title = await page.title();
    expect(title).to.equal('Queues | Tenlastic');
  });

  step('navigates to the New Queue page', async function () {
    const button = await helpers.getButtonByText(page, 'New Queue');
    await helpers.click(button, page);

    const title = await page.title();
    expect(title).to.equal('New Queue | Tenlastic');
  });

  step('creates a Queue', async function () {
    const nameInput = await helpers.getInputByLabel('Name', page);
    await helpers.type(nameInput, page, queue);

    const button = await helpers.getButtonByText(page, 'Save');
    await helpers.click(button, page);

    await page.waitForXPath(`//app-title[contains(text(), 'Edit Queue')]`, { timeout: 2500 });

    const title = await page.title();
    expect(title).to.equal('Edit Queue | Tenlastic');
  });

  step('runs the Queue successfully', async function () {
    const criteria = [
      `.//input[@ng-reflect-value='Running']`,
      `.//mat-label[contains(., 'Phase')]`,
    ];

    await page.waitForXPath(`//mat-form-field[${criteria.join(' and ')}]`, { timeout: 30 * 1000 });
  });

  step('generates logs', async function () {
    const button = await helpers.getButtonByText(page, 'Queues');
    await helpers.click(button, page);

    const title = await page.title();
    expect(title).to.equal('Queues | Tenlastic');

    const logsButton = await helpers.getButtonByIcon('subject', page);
    await logsButton.click();

    await page.waitForXPath(
      `//app-logs-dialog//span[contains(., 'Koa server running on port 3000.')]`,
      { timeout: 2500 },
    );
  });
});
