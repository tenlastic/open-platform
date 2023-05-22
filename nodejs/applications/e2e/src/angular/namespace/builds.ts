import * as Chance from 'chance';
import { Page } from 'puppeteer';

import * as helpers from '../helpers';

const chance = new Chance();

describe('/angular/namespace/builds', () => {
  let namespace: string;
  let page: Page;

  beforeEach(async function () {
    page = await helpers.newPage(true);
  });

  afterEach(async function () {
    await helpers.screenshot(this, page);

    const browser = page.browser();
    await browser.close();

    await helpers.deleteNamespace(namespace);
  });

  it('creates a Namespace and Build', async function () {
    // Create the Namespace.
    namespace = chance.hash({ length: 64 });
    await helpers.createNamespace(namespace, page);

    // Create the Build.
    const build = chance.hash({ length: 64 });
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
