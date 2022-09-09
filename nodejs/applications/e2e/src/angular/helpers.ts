import wait from '@tenlastic/wait';
import { ElementHandle, Page } from 'puppeteer';

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

export async function getButtonByIcon(icon: string, page: Page, timeout = 2500) {
  const selector = `//app-button//a[not(@disabled) and .//mat-icon[text() = '${icon}']]`;
  await waitForXPath(page, selector, { timeout });
  const elements = await page.$x(selector);
  return elements[0];
}

export async function getButtonByText(page: Page, text: string, timeout = 2500) {
  const selector = `//app-button//a[not(@disabled) and .//span[contains(text(), '${text}')]]`;
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
