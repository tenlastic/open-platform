import wait from '@tenlastic/wait';
import * as Chance from 'chance';
import { Page } from 'puppeteer';

import * as helpers from '../helpers';

const chance = new Chance();

describe('/angular/namespace/collections', () => {
  let namespace: string;
  let page: Page;

  beforeEach(async function () {
    namespace = `Angular - Collections (${chance.hash({ length: 16 })})`;
    page = await helpers.newPage(true);
  });

  afterEach(async function () {
    await helpers.screenshot(`Collections`, page);

    const browser = page.browser();
    await browser.close();

    await wait(1 * 1000, 15 * 1000, () => helpers.deleteNamespace(namespace));
  });

  it('creates a Namespace, Collection, and Record', async function () {
    // Create the Namespace.
    await helpers.createNamespace(namespace, page);

    // Navigate to the "New Collection" page.
    const collectionsPage = await helpers.getButtonByText(page, 'Collections');
    await helpers.clickAndNavigate(collectionsPage, page, 'Collections | Tenlastic');

    const newCollectionPage = await helpers.getButtonByText(page, 'New Collection');
    await helpers.clickAndNavigate(newCollectionPage, page, 'New Collection | Tenlastic');

    // Create the Collection.
    const collection = chance.hash({ length: 32 });
    const collectionNameInput = await helpers.getInputByLabel('Name', page);
    await helpers.type(collectionNameInput, page, collection);

    const keyInput = await helpers.getInputByLabel('Key', page);
    await helpers.type(keyInput, page, 'name');

    const typeDropdown = await helpers.getDropdownByLabel('Type', page);
    await typeDropdown.click();

    const stringOption = await helpers.getElementByXPath(
      page,
      `//mat-option[span[contains(text(), 'String')]]`,
    );
    await stringOption.click();

    await helpers.sleep(1000);

    const saveCollectionButton = await helpers.getButtonByText(page, 'Save');
    await helpers.clickAndNavigate(saveCollectionButton, page, 'Edit Collection | Tenlastic');

    // Navigate to the "New Record" page.
    const recordsButton = await helpers.getButtonByText(page, 'Records');
    await helpers.clickAndNavigate(recordsButton, page, 'Records | Tenlastic');

    const newRecordButton = await helpers.getButtonByText(page, 'New Record');
    await helpers.clickAndNavigate(newRecordButton, page, 'New Record | Tenlastic');

    // Create the Record.
    const recordNameInput = await helpers.getInputByLabel('Name', page);
    await helpers.type(recordNameInput, page, collection);

    const saveRecordButton = await helpers.getButtonByText(page, 'Save');
    await helpers.clickAndNavigate(saveRecordButton, page, 'Edit Record | Tenlastic');
  });
});
