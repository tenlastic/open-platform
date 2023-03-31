import wait from '@tenlastic/wait';
import axios from 'axios';
import { expect } from 'chai';
import * as Chance from 'chance';
import * as fs from 'fs';
import * as puppeteer from 'puppeteer';

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
    // Generate a name for the Namespace.
    build = chance.hash({ length: 64 });
    gameServer = chance.hash({ length: 64 });
    namespace = chance.hash({ length: 64 });

    // Open a new browser and load the home page.
    browser = await puppeteer.launch({ args: ['--disable-setuid-sandbox', '--no-sandbox'] });
    page = await browser.newPage();
    page.setViewport({ width: 1920, height: 1080 });
    await helpers.setTokensOnPageLoad(administratorAccessToken, page, administratorRefreshToken);
    await page.goto(process.env.E2E_WWW_URL, { waitUntil: 'networkidle0' });
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
    await wait(100, 2 * 60 * 1000, async () => {
      const [input] = await page.$x(`//mat-form-field[.//mat-label[contains(., 'Phase')]]//input`);
      const value = await page.evaluate((i) => i.value, input);

      return value === 'Running';
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
      { timeout: 3 * 60 * 1000 },
    );
  });

  step('publishes the Build', async function () {
    const button = await helpers.getButtonByText(page, 'Builds');
    await helpers.clickAndNavigate(button, page, 'Builds | Tenlastic');

    const publishButton = await helpers.getButtonByTooltip(page, 'Publish');
    await publishButton.click();
  });

  step('navigates to the Game Servers page', async function () {
    const button = await helpers.getButtonByText(page, 'Game Servers');
    await helpers.clickAndNavigate(button, page, 'Game Servers | Tenlastic');
  });

  step('navigates to the New Game Server page', async function () {
    const button = await helpers.getButtonByText(page, 'New Game Server');
    await helpers.clickAndNavigate(button, page, 'New Game Server | Tenlastic');
  });

  step('creates a Game Server', async function () {
    const nameInput = await helpers.getInputByLabel('Name', page);
    await helpers.type(nameInput, page, gameServer);

    const button = await helpers.getButtonByText(page, 'Save');
    await helpers.clickAndNavigate(button, page, 'Edit Game Server | Tenlastic');
  });

  step('runs the Game Server successfully', async function () {
    await wait(100, 60 * 1000, async () => {
      const [input] = await page.$x(`//mat-form-field[.//mat-label[contains(., 'Phase')]]//input`);
      const value = await page.evaluate((i) => i.value, input);

      return value === 'Running';
    });
  });

  step('allows connections', async function () {
    const externalIpInput = await helpers.getInputByLabel('External IP', page);
    const externalIp = await page.evaluate((ti) => ti.value, externalIpInput);
    const externalPortInput = await helpers.getInputByLabel('External Port', page);
    const externalPort = await page.evaluate((ti) => ti.value, externalPortInput);

    const hostname = externalIp === '127.0.0.1' ? 'kubernetes.local.tenlastic.com' : externalIp;

    const response = await axios({ method: 'get', url: `http://${hostname}:${externalPort}` });
    expect(response.data).to.include('Welcome to echo-server!');
  });

  step('generates logs', async function () {
    const button = await helpers.getButtonByText(page, 'Game Servers');
    await helpers.clickAndNavigate(button, page, 'Game Servers | Tenlastic');

    const logsButton = await helpers.getButtonByTooltip(page, 'Logs');
    await logsButton.click();

    await helpers.waitForXPath(
      page,
      `//app-logs-dialog//div[contains(., 'Echo server listening on port :7777.')]`,
      { timeout: 2500 },
    );
  });
});
