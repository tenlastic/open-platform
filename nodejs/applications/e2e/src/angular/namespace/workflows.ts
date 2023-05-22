import * as Chance from 'chance';
import { Page } from 'puppeteer';

import * as helpers from '../helpers';

const chance = new Chance();

describe('/angular/namespace/workflows', () => {
  let namespace: string;
  let page: Page;

  beforeEach(async function () {
    page = await helpers.newPage();
  });

  afterEach(async function () {
    const browser = page.browser();
    await browser.close();

    helpers.deleteNamespace(namespace);
    helpers.screenshot(this, page);
  });

  it('creates a Namespace and Workflow', async function () {
    // Create the Namespace.
    namespace = chance.hash({ length: 64 });
    await helpers.createNamespace(namespace, page);

    // Navigate to the "New Workflows" page.
    const workflowsButton = await helpers.getButtonByText(page, 'Workflows');
    await helpers.clickAndNavigate(workflowsButton, page, 'Workflows | Tenlastic');

    const newWorkflowButton = await helpers.getButtonByText(page, 'New Workflow');
    await helpers.clickAndNavigate(newWorkflowButton, page, 'New Workflow | Tenlastic');

    // Create the Workflow.
    const workflow = chance.hash({ length: 64 });
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

    // Wait for the Workflow to finish successfully.
    await helpers.waitForXPath(
      page,
      `//app-workflow-status-node[contains(div, 'Workflow') and contains(div, 'Succeeded')]`,
      { timeout: 60 * 1000 },
    );

    // Check for Workflow Logs.
    const logsButton = await helpers.getButtonByText(page, 'Logs');
    await logsButton.click();

    await helpers.waitForXPath(page, `//app-logs-dialog//div[contains(., 'Hello World!')]`, {
      timeout: 2500,
    });
  });
});
