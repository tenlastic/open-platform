import wait from '@tenlastic/wait';
import * as Chance from 'chance';
import * as fs from 'fs';
import * as puppeteer from 'puppeteer';

import dependencies from '../../dependencies';
import { step } from '../../step';
import { administratorAccessToken, administratorRefreshToken } from '../../';
import * as helpers from '../helpers';

const chance = new Chance();

describe('/angular/namespace/workflows', () => {
  let browser: puppeteer.Browser;
  let namespace: string;
  let page: puppeteer.Page;
  let workflow: string;

  before(async function () {
    // Generate a name for the Namespace.
    namespace = chance.hash({ length: 64 });
    workflow = chance.hash({ length: 64 });

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

  step('navigates to the Workflows page', async function () {
    const button = await helpers.getButtonByText(page, 'Workflows');
    await helpers.clickAndNavigate(button, page, 'Workflows | Tenlastic');
  });

  step('navigates to the New Workflow page', async function () {
    const button = await helpers.getButtonByText(page, 'New Workflow');
    await helpers.clickAndNavigate(button, page, 'New Workflow | Tenlastic');
  });

  step('creates a Workflow', async function () {
    const nameInput = await helpers.getInputByLabel('Name', page);
    await helpers.type(nameInput, page, workflow);

    const templateNameInput = await helpers.getInputByPlaceholder(page, 'Echo');
    await helpers.type(templateNameInput, page, 'Echo');

    const dockerImageInput = await helpers.getInputByLabel('Docker Image', page);
    await helpers.type(dockerImageInput, page, 'alpine:latest');

    const commandInput = await helpers.getInputByLabel('Command', page);
    await helpers.type(commandInput, page, '/bin/sh');

    const sourceInput = await helpers.getTextareaByLabel('Source', page);
    await helpers.type(sourceInput, page, 'echo $MESSAGE');

    const addEnvironmentVariableButton = await helpers.getButtonByText(
      page,
      'Add Environment Variable',
    );
    await addEnvironmentVariableButton.click();

    const keyInput = await helpers.getInputByPlaceholder(page, 'MESSAGE');
    await helpers.type(keyInput, page, 'MESSAGE');

    const valueInput = await helpers.getInputByPlaceholder(page, 'Hello World!');
    await helpers.type(valueInput, page, 'Hello World!');

    const saveButton = await helpers.getButtonByText(page, 'Save');
    await helpers.clickAndNavigate(saveButton, page, 'Edit Workflow | Tenlastic');
  });

  step('finishes the Workflow successfully', async function () {
    await helpers.waitForXPath(
      page,
      `//app-workflow-status-node[contains(div, 'Workflow') and contains(div, 'Succeeded')]`,
      { timeout: 60 * 1000 },
    );
  });

  step('generates logs', async function () {
    const button = await helpers.getButtonByText(page, 'Logs');
    await button.click();

    await helpers.waitForXPath(page, `//app-logs-dialog//div[contains(., 'Hello World!')]`, {
      timeout: 2500,
    });
  });
});
