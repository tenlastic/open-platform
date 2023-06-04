import wait from '@tenlastic/wait';
import axios from 'axios';
import { expect } from 'chai';
import * as Chance from 'chance';
import { Page } from 'puppeteer';

import * as helpers from '../helpers';

const chance = new Chance();

describe('/angular/namespace/game-servers', () => {
  let namespace: string;
  let page: Page;

  beforeEach(async function () {
    namespace = `Angular - Game Servers (${chance.hash({ length: 16 })})`;
    page = await helpers.newPage(true);
  });

  afterEach(async function () {
    await helpers.screenshot(`Game Servers`, page);

    const browser = page.browser();
    await browser.close();

    await wait(1 * 1000, 15 * 1000, () => helpers.deleteNamespace(namespace));
  });

  it('creates a Namespace, Build, and Game Server', async function () {
    // Create the Namespace.
    await helpers.createNamespace(namespace, page);

    // Create the Build.
    const build = chance.hash({ length: 32 });
    await helpers.createBuild(build, page);

    // Publish the Build.
    const buildsButton = await helpers.getButtonByText(page, 'Builds');
    await helpers.clickAndNavigate(buildsButton, page, 'Builds | Tenlastic');

    const publishButton = await helpers.getButtonByTooltip(page, 'Publish');
    await publishButton.click();

    // Navigate the "New Game Server" page.
    const gameServersButton = await helpers.getButtonByText(page, 'Game Servers');
    await helpers.clickAndNavigate(gameServersButton, page, 'Game Servers | Tenlastic');

    const newGameServerButton = await helpers.getButtonByText(page, 'New Game Server');
    await helpers.clickAndNavigate(newGameServerButton, page, 'New Game Server | Tenlastic');

    // Create the Game Server.
    const gameServer = chance.hash({ length: 32 });
    const nameInput = await helpers.getInputByLabel('Name', page);
    await helpers.type(nameInput, page, gameServer);

    const saveButtton = await helpers.getButtonByText(page, 'Save');
    await helpers.clickAndNavigate(saveButtton, page, 'Edit Game Server | Tenlastic');

    // Wait for the Game Server to be Running.
    await wait(100, 60 * 1000, async () => {
      const [input] = await page.$x(`//mat-form-field[.//mat-label[contains(., 'Phase')]]//input`);
      const value = await page.evaluate((i) => i.value, input);

      return value === 'Running';
    });

    // Connect to the Game Server.
    const externalIpInput = await helpers.getInputByLabel('External IP', page);
    const externalIp = await page.evaluate((ti) => ti.value, externalIpInput);
    const externalPortInput = await helpers.getInputByLabel('External Port', page);
    const externalPort = await page.evaluate((ti) => ti.value, externalPortInput);

    const hostname = externalIp === '127.0.0.1' ? 'kubernetes.local.tenlastic.com' : externalIp;

    const response = await axios({ method: 'get', url: `http://${hostname}:${externalPort}` });
    expect(response.data).to.include('Welcome to echo-server!');

    // Check for Game Server Logs.
    await helpers.clickAndNavigate(gameServersButton, page, 'Game Servers | Tenlastic');

    const logsButton = await helpers.getButtonByTooltip(page, 'Logs');
    await logsButton.click();

    await helpers.waitForXPath(
      page,
      `//app-logs-dialog//div[contains(., 'Echo server listening on port :7777.')]`,
      { timeout: 2500 },
    );
  });
});
