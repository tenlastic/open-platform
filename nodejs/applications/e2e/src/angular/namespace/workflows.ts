import wait from '@tenlastic/wait';
import * as Chance from 'chance';
import { Page } from 'puppeteer';

import * as helpers from '../helpers';

const chance = new Chance();

describe('/angular/namespace/workflows', () => {
  let namespace: string;
  let page: Page;

  beforeEach(async function () {
    namespace = `Angular - Workflows (${chance.hash({ length: 16 })})`;
    page = await helpers.newPage(true);
  });

  afterEach(async function () {
    await helpers.screenshot(`Workflows`, page);

    const browser = page.browser();
    await browser.close();

    await wait(1 * 1000, 15 * 1000, () => helpers.deleteNamespace(namespace));
  });

  it('creates a Namespace and Workflow', async function () {
    // Create the Namespace.
    await helpers.createNamespace(namespace, page);

    // Navigate to the "New Workflows" page.
    const workflowsButton = await helpers.getButtonByText(page, 'Workflows');
    await helpers.clickAndNavigate(workflowsButton, page, 'Workflows | Tenlastic');

    const newWorkflowButton = await helpers.getButtonByText(page, 'New Workflow');
    await helpers.clickAndNavigate(newWorkflowButton, page, 'New Workflow | Tenlastic');

    // Create the Workflow.
    const workflow = chance.hash({ length: 32 });
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
    await helpers.click(addEnvironmentVariableButton, page);

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
    await helpers.click(logsButton, page);

    await helpers.waitForXPath(page, `//app-logs-dialog//div[contains(., 'Hello World!')]`, {
      timeout: 2500,
    });
  });
});
