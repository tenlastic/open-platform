import axios from 'axios';
import { expect } from 'chai';
import * as Chance from 'chance';
import * as fs from 'fs';
import * as puppeteer from 'puppeteer';
import { URL } from 'url';

import dependencies from '../../dependencies';
import { step } from '../../step';
import { administratorAccessToken, administratorRefreshToken } from '../../';
import * as helpers from '../helpers';

const chance = new Chance();

describe('/angular/namespace/game-servers', () => {
  let browser: puppeteer.Browser;
  let build: string;
  let gameServer: string;
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
    gameServer = chance.hash();
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

  step('finishes the build successfully', async function () {
    await page.waitForXPath(
      `//app-build-status-node[contains(div, 'Workflow') and contains(div, 'Succeeded')]`,
      { timeout: 120 * 1000 },
    );
  });

  step('publishes the build', async function () {
    const button = await helpers.getButtonByText(page, 'Builds');
    await helpers.click(button, page);

    const title = await page.title();
    expect(title).to.equal('Builds | Tenlastic');

    const publishButton = await helpers.getButtonByIcon('visibility', page);
    await publishButton.click();
  });

  step('navigates to the game servers page', async function () {
    const button = await helpers.getButtonByText(page, 'Game Servers');
    await helpers.click(button, page);

    const title = await page.title();
    expect(title).to.equal('Game Servers | Tenlastic');
  });

  step('navigates to the new game server page', async function () {
    const button = await helpers.getButtonByText(page, 'New Game Server');
    await helpers.click(button, page);

    const title = await page.title();
    expect(title).to.equal('New Game Server | Tenlastic');
  });

  step('creates a game server', async function () {
    const nameInput = await helpers.getInputByLabel('Name', page);
    await helpers.type(nameInput, page, gameServer);

    const button = await helpers.getButtonByText(page, 'Save');
    await helpers.click(button, page);

    await page.waitForXPath(`//app-title[contains(text(), 'Edit Game Server')]`, { timeout: 2500 });

    const title = await page.title();
    expect(title).to.equal('Edit Game Server | Tenlastic');
  });

  step('runs the game server successfully', async function () {
    await page.waitForXPath(
      `//mat-form-field[.//input[@ng-reflect-value='Running'] and .//mat-label[contains(., 'Phase')]]`,
      { timeout: 30 * 1000 },
    );
  });

  step('allows connections', async function () {
    const tcpInput = await helpers.getInputByLabel('TCP Endpoint', page);
    const tcpValue = await page.evaluate((ti) => ti.value, tcpInput);
    const http = tcpValue.replace('tcp', 'http');
    const url = new URL(http);
    url.hostname = url.hostname === '127.0.0.1' ? 'kubernetes.local.tenlastic.com' : url.hostname;

    const response = await axios({ method: 'get', url: url.href });
    expect(response.data).to.include('Welcome to echo-server!');
  });

  step('generates logs', async function () {
    const button = await helpers.getButtonByText(page, 'Game Servers');
    await helpers.click(button, page);

    const title = await page.title();
    expect(title).to.equal('Game Servers | Tenlastic');

    const logsButton = await helpers.getButtonByIcon('subject', page);
    await logsButton.click();

    await page.waitForXPath(
      `//app-logs-dialog//span[contains(., 'Echo server listening on port :7777.')]`,
      { timeout: 2500 },
    );
  });
});
