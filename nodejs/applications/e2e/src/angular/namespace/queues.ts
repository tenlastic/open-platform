import wait from '@tenlastic/wait';
import * as Chance from 'chance';
import { Page } from 'puppeteer';

import * as helpers from '../helpers';

const chance = new Chance();

describe('/angular/namespace/queues', () => {
  let namespace: string;
  let page: Page;

  beforeEach(async function () {
    namespace = `Angular - Queues (${chance.hash({ length: 16 })})`;
    page = await helpers.newPage(true);
  });

  afterEach(async function () {
    await helpers.screenshot(`Queues`, page);

    const browser = page.browser();
    await browser.close();

    await wait(1 * 1000, 15 * 1000, () => helpers.deleteNamespace(namespace));
  });

  it('creates a Namespace, Build, Game Server Template, and Queue', async function () {
    // Create the Namespace.
    await helpers.createNamespace(namespace, page);

    // Create the Build.
    const build = chance.hash({ length: 32 });
    await helpers.createBuild(build, page);

    // Publish the Build.
    const buildsButton = await helpers.getButtonByText(page, 'Builds');
    await helpers.clickAndNavigate(buildsButton, page, 'Builds | Tenlastic');

    const publishButton = await helpers.getButtonByTooltip(page, 'Publish');
    await helpers.click(publishButton, page);

    // Navigate to the "New Game Server Template" page.
    const gameServerTemplatesButton = await helpers.getButtonByText(page, 'Game Server Templates');
    await helpers.clickAndNavigate(
      gameServerTemplatesButton,
      page,
      'Game Server Templates | Tenlastic',
    );

    const newGameServerTemplateButton = await helpers.getButtonByText(
      page,
      'New Game Server Template',
    );
    await helpers.clickAndNavigate(
      newGameServerTemplateButton,
      page,
      'New Game Server Template | Tenlastic',
    );

    // Create the Game Server Template.
    const gameServerTemplate = chance.hash({ length: 32 });
    const gameServerTemplateNameInput = await helpers.getInputByLabel('Name', page);
    await helpers.type(gameServerTemplateNameInput, page, gameServerTemplate);

    const saveGameServerTemplateButton = await helpers.getButtonByText(page, 'Save');
    await helpers.clickAndNavigate(
      saveGameServerTemplateButton,
      page,
      'Edit Game Server Template | Tenlastic',
    );

    // Navigate to the "New Queue" page.
    const queuesButton = await helpers.getButtonByText(page, 'Queues');
    await helpers.clickAndNavigate(queuesButton, page, 'Queues | Tenlastic');

    const newQueueButton = await helpers.getButtonByText(page, 'New Queue');
    await helpers.clickAndNavigate(newQueueButton, page, 'New Queue | Tenlastic');

    // Create the Queue.
    const queue = chance.hash({ length: 32 });
    const queueNameInput = await helpers.getInputByLabel('Name', page);
    await helpers.type(queueNameInput, page, queue);

    const gameServerTemplateDropdown = await helpers.getDropdownByLabel(
      'Game Server Template',
      page,
    );
    await gameServerTemplateDropdown.click();

    const gameServerTemplateOption = await helpers.getElementByXPath(
      page,
      `//mat-option[span[contains(text(), '${gameServerTemplate}')]]`,
    );
    await gameServerTemplateOption.click();

    const saveQueueButton = await helpers.getButtonByText(page, 'Save');
    await helpers.clickAndNavigate(saveQueueButton, page, 'Edit Queue | Tenlastic');

    // Wait for the Queue to be Running.
    await wait(100, 60 * 1000, async () => {
      const [input] = await page.$x(`//mat-form-field[.//mat-label[contains(., 'Phase')]]//input`);
      const value = await page.evaluate((i) => i.value, input);

      return value === 'Running';
    });

    // Wait for the Pod to initialize.
    await helpers.sleep(5 * 1000);

    // Check for Queue Logs.
    await helpers.clickAndNavigate(queuesButton, page, 'Queues | Tenlastic');

    const logsButton = await helpers.getButtonByTooltip(page, 'Logs');
    await helpers.click(logsButton, page);

    const startLiveTailButton = await helpers.getButtonByText(page, 'Start Live Tail');
    await helpers.click(startLiveTailButton, page);

    await helpers.waitForXPath(
      page,
      `//app-logs-dialog//div[contains(., 'Found 0 initial Queue Members.')]`,
      { timeout: 10 * 1000 },
    );
  });
});
