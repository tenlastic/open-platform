import { expect } from 'chai';
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
    // Open a new browser and load the home page.
    browser = await puppeteer.launch({ args: ['--disable-setuid-sandbox', '--no-sandbox'] });
    page = await browser.newPage();
    page.setViewport({ width: 1920, height: 1080 });
    await helpers.setTokensOnPageLoad(administratorAccessToken, page, administratorRefreshToken);
    await page.goto('http://www.local.tenlastic.com', { waitUntil: 'networkidle0' });

    // Generate a name for the Namespace.
    namespace = chance.hash();
    workflow = chance.hash();
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

  step('navigates to the workflows page', async function () {
    const button = await helpers.getButtonByText(page, 'Workflows');
    await helpers.click(button, page);

    const title = await page.title();
    expect(title).to.equal('Workflows | Tenlastic');
  });

  step('navigates to the new workflow page', async function () {
    const button = await helpers.getButtonByText(page, 'New Workflow');
    await helpers.click(button, page);

    const title = await page.title();
    expect(title).to.equal('New Workflow | Tenlastic');
  });

  step('creates a workflow', async function () {
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
    await helpers.click(saveButton, page);

    await page.waitForXPath(`//app-title[contains(text(), 'Edit Workflow')]`, { timeout: 2500 });

    const title = await page.title();
    expect(title).to.equal('Edit Workflow | Tenlastic');
  });

  step('finishes the workflow successfully', async function () {
    await page.waitForXPath(
      `//app-workflow-status-node[contains(div, 'Workflow') and contains(div, 'Succeeded')]`,
      { timeout: 60 * 1000 },
    );
  });

  step('generates logs', async function () {
    const button = await helpers.getButtonByText(page, 'Logs');
    await button.click();

    await page.waitForXPath(`//app-logs-dialog//span[contains(., 'Hello World!')]`, {
      timeout: 2500,
    });
  });
});
