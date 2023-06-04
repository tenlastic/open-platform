import wait from '@tenlastic/wait';
import * as fs from 'fs';
import { ElementHandle, launch, Page } from 'puppeteer';

import { administratorAccessToken, administratorRefreshToken } from '../';
import dependencies from '../dependencies';

export interface WaitForXPathOptions {
  interval?: number;
  timeout?: number;
}

export async function clickAndNavigate(element: ElementHandle, page: Page, title: string) {
  await element.click();

  return wait(100, 2500, async () => {
    const t = await page.title();
    return t === title;
  });
}

export async function createBuild(build: string, page: Page) {
  // Navigate to the "New Build" page.
  const buildsButton = await getButtonByText(page, 'Builds');
  await clickAndNavigate(buildsButton, page, 'Builds | Tenlastic');

  const newBuildButton = await getButtonByText(page, 'New Build');
  await clickAndNavigate(newBuildButton, page, 'New Build | Tenlastic');

  // Create the Build.
  const nameInput = await getInputByLabel('Name', page);
  await type(nameInput, page, build);

  const selectFileFromComputerButton = await getButtonByText(page, 'Select Files from Computer');
  const [fileChooser] = await Promise.all([
    page.waitForFileChooser(),
    selectFileFromComputerButton.click(),
  ]);
  await fileChooser.accept(['./fixtures/Dockerfile']);

  const dockerfileListItem = await getElementByXPath(page, `//div[contains(text(), 'Dockerfile')]`);
  await dockerfileListItem.click();

  await sleep(1000);

  const saveButton = await getButtonByText(page, 'Save');
  await clickAndNavigate(saveButton, page, 'Edit Build | Tenlastic');

  // Wait for the Build to finish successfully.
  await waitForXPath(
    page,
    `//app-build-status-node[contains(div, 'Workflow') and contains(div, 'Succeeded')]`,
    { timeout: 3 * 60 * 1000 },
  );
}

export async function createNamespace(namespace: string, page: Page) {
  // Navigate to the "New Namespace" page.
  const managementPortalButton = await getButtonByText(page, 'Management Portal');
  await clickAndNavigate(managementPortalButton, page, 'Namespaces | Tenlastic');

  const newNamespaceButton = await getButtonByText(page, 'New Namespace');
  await clickAndNavigate(newNamespaceButton, page, 'New Namespace | Tenlastic');

  // Create the Namespace.
  const bandwidthInput = await getInputByLabel('Bandwidth', page);
  await type(bandwidthInput, page, `${1 * 1000 * 1000 * 1000}`);

  const cpuInput = await getInputByLabel('CPU', page);
  await type(cpuInput, page, `${1}`);

  const memoryInput = await getInputByLabel('Memory', page);
  await type(memoryInput, page, `${1 * 1000 * 1000 * 1000}`);

  const nameInput = await getInputByLabel('Name', page);
  await type(nameInput, page, namespace);

  const storageInput = await getInputByLabel('Storage', page);
  await type(storageInput, page, `${10 * 1000 * 1000 * 1000}`);

  const saveButton = await getButtonByText(page, 'Save');
  await clickAndNavigate(saveButton, page, 'Edit Namespace | Tenlastic');

  // Wait for the Namespace to run successfully.
  await wait(100, 2 * 60 * 1000, async () => {
    const [input] = await page.$x(`//mat-form-field[.//mat-label[contains(., 'Phase')]]//input`);
    const value = await page.evaluate((i) => i.value, input);

    return value === 'Running';
  });

  return namespace;
}

export async function deleteNamespace(name: string) {
  if (!name) {
    return true;
  }

  const namespaces = await dependencies.namespaceService.find({ where: { name } });
  if (namespaces.length === 0) {
    return true;
  }

  return dependencies.namespaceService.delete(namespaces[0]._id);
}

export async function deleteUser(username: string) {
  if (!username) {
    return true;
  }

  const users = await dependencies.userService.find({ where: { username } });
  if (users.length === 0) {
    return true;
  }

  return dependencies.userService.delete(users[0]._id);
}

export async function getButtonByIcon(icon: string, page: Page, timeout = 2500) {
  const selector = `//app-button//button[not(@disabled) and .//mat-icon[text() = '${icon}']]`;
  await waitForXPath(page, selector, { timeout });
  const elements = await page.$x(selector);
  return elements[0];
}

export async function getButtonByText(page: Page, text: string, timeout = 2500) {
  const selector = `//app-button//button[not(@disabled) and .//div[text() = '${text}']]`;
  await waitForXPath(page, selector, { timeout });
  const elements = await page.$x(selector);
  return elements[0];
}

export async function getButtonByTooltip(page: Page, tooltip: string, timeout = 2500) {
  const selector = `//app-button[@matTooltip='${tooltip}']//button[not(@disabled)]`;
  await waitForXPath(page, selector, { timeout });
  const elements = await page.$x(selector);
  return elements[0];
}

export async function getDropdownByLabel(label: string, page: Page, timeout = 2500) {
  const selector = `//mat-form-field[.//mat-label[contains(text(), '${label}')]]`;
  await waitForXPath(page, selector, { timeout });
  const elements = await page.$x(selector);
  return elements[0];
}

export async function getElementByXPath(page: Page, selector: string, timeout = 2500) {
  await waitForXPath(page, selector, { timeout });
  const elements = await page.$x(selector);
  return elements[0];
}

export async function getInputByLabel(label: string, page: Page, timeout = 2500) {
  const selector = `//mat-form-field//input[..//mat-label[contains(text(), '${label}')]]`;
  await waitForXPath(page, selector, { timeout });
  const elements = await page.$x(selector);
  return elements[0];
}

export async function getInputByPlaceholder(page: Page, placeholder: string, timeout = 2500) {
  const selector = `//mat-form-field//input[@placeholder='${placeholder}']`;
  await waitForXPath(page, selector, { timeout });
  const elements = await page.$x(selector);
  return elements[0];
}

export async function getTextareaByLabel(label: string, page: Page, timeout = 2500) {
  const selector = `//mat-form-field//textarea[..//mat-label[contains(text(), '${label}')]]`;
  await waitForXPath(page, selector, { timeout });
  const elements = await page.$x(selector);
  return elements[0];
}

export async function newPage(logIn = false) {
  const browser = await launch({ args: ['--disable-setuid-sandbox', '--no-sandbox'] });
  const page = await browser.newPage();
  page.setViewport({ width: 1920, height: 1080 });

  if (logIn) {
    await setTokensOnPageLoad(administratorAccessToken, page, administratorRefreshToken);
  }

  await page.goto(process.env.E2E_WWW_URL, { waitUntil: 'networkidle0' });
  return page;
}

export async function screenshot(filename: string, page: Page) {
  fs.mkdirSync('./test-results/puppeteer', { recursive: true });
  await page.screenshot({ path: `./test-results/puppeteer/${filename}.png` });
}

export async function selectDropdownOptionByLabel(label: string, page: Page, timeout = 2500) {
  const option = await getElementByXPath(
    page,
    `//mat-option[span[contains(text(), '${label}')]]`,
    timeout,
  );
  return option.click();
}

export function setTokensOnPageLoad(accessToken: string, page: Page, refreshToken: string) {
  return page.evaluateOnNewDocument(`
    localStorage.setItem('accessToken', '${accessToken}');
    localStorage.setItem('refreshToken', '${refreshToken}');
  `);
}

export function sleep(milliseconds: number) {
  return new Promise((res) => setTimeout(res, milliseconds));
}

export async function type(element: ElementHandle, page: Page, text: string) {
  await element.focus();
  await page.keyboard.type(text);
}

export async function waitForXPath(
  page: Page,
  selector: string,
  options: WaitForXPathOptions = { interval: 100, timeout: 2500 },
) {
  return wait(options.interval || 100, options.timeout || 2500, async () => {
    const elements = await page.$x(selector);
    return elements.length > 0 ? elements : null;
  });
}
