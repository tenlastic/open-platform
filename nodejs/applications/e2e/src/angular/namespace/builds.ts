import wait from '@tenlastic/wait';
import * as Chance from 'chance';
import { Page } from 'puppeteer';

import * as helpers from '../helpers';

const chance = new Chance();

describe('/angular/namespace/builds', () => {
  let namespace: string;
  let page: Page;

  beforeEach(async function () {
    namespace = `Angular - Builds (${chance.hash({ length: 16 })})`;
    page = await helpers.newPage(true);
  });

  afterEach(async function () {
    await helpers.screenshot(`Builds`, page);

    const browser = page.browser();
    await browser.close();

    await wait(1 * 1000, 15 * 1000, () => helpers.deleteNamespace(namespace));
  });

  it('creates a Namespace and Build', async function () {
    // Create the Namespace.
    await helpers.createNamespace(namespace, page);

    // Create the Build.
    const build = chance.hash({ length: 32 });
    await helpers.createBuild(build, page);

    // Check for Build Logs.
    const logsButton = await helpers.getButtonByText(page, 'Logs');
    await logsButton.click();

    await helpers.waitForXPath(
      page,
      `//app-logs-dialog//div[contains(., 'Downloading file: Dockerfile.')]`,
      { timeout: 2500 },
    );
  });
});
