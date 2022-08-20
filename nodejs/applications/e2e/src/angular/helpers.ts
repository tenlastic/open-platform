import { ElementHandle, Page } from 'puppeteer';

export async function click(element: ElementHandle, page: Page) {
  return Promise.all([
    element.click(),
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.waitForNetworkIdle({ idleTime: 100 }),
  ]);
}

export async function getButtonByIcon(icon: string, page: Page, timeout = 2500) {
  const selector = `//app-button//a[.//mat-icon[text() = '${icon}']]`;
  await page.waitForXPath(selector, { timeout });
  const elements = await page.$x(selector);
  return elements[0];
}

export async function getButtonByText(page: Page, text: string, timeout = 2500) {
  const selector = `//app-button//a[.//span[contains(text(), '${text}')]]`;
  await page.waitForXPath(selector, { timeout });
  const elements = await page.$x(selector);
  return elements[0];
}

export async function getDropdownByLabel(label: string, page: Page, timeout = 2500) {
  const selector = `//mat-form-field[.//mat-label[contains(text(), '${label}')]]`;
  await page.waitForXPath(selector, { timeout });
  const elements = await page.$x(selector);
  return elements[0];
}

export async function getElementByXPath(page: Page, selector: string, timeout = 2500) {
  await page.waitForXPath(selector, { timeout });
  const elements = await page.$x(selector);
  return elements[0];
}

export async function getInputByLabel(label: string, page: Page, timeout = 2500) {
  const selector = `//mat-form-field//input[..//mat-label[contains(text(), '${label}')]]`;
  await page.waitForXPath(selector, { timeout });
  const elements = await page.$x(selector);
  return elements[0];
}

export async function getInputByPlaceholder(page: Page, placeholder: string, timeout = 2500) {
  const selector = `//mat-form-field//input[@placeholder='${placeholder}']`;
  await page.waitForXPath(selector, { timeout });
  const elements = await page.$x(selector);
  return elements[0];
}

export async function getTextareaByLabel(label: string, page: Page, timeout = 2500) {
  const selector = `//mat-form-field//textarea[..//mat-label[contains(text(), '${label}')]]`;
  await page.waitForXPath(selector, { timeout });
  const elements = await page.$x(selector);
  return elements[0];
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
