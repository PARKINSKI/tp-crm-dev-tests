import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Responsive-layout assertions.
 *
 * The product contract is: no page-level horizontal scrolling. Internal
 * `.table-scroll` containers may keep contained overflow as a defensive
 * fallback for very dense screens, but the document itself must never
 * overflow the viewport.
 */

/** Tolerance for sub-pixel rounding only — not a hiding place. */
const TOLERANCE_PX = 1;

/**
 * Asserts the document does not scroll horizontally at the current
 * viewport: `documentElement.scrollWidth <= clientWidth` (+1px rounding).
 */
export async function expectNoPageHorizontalOverflow(
  page: Page,
  context = '',
): Promise<void> {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    scrollWidth - clientWidth,
    `page-level horizontal overflow${context ? ` on ${context}` : ''} (scrollWidth ${scrollWidth} > clientWidth ${clientWidth})`,
  ).toBeLessThanOrEqual(TOLERANCE_PX);
}

/**
 * Asserts a container element is not itself horizontally scrollable — for
 * the priority list screens where the responsive implementation replaces
 * scrolling with reflowed columns/cards.
 */
export async function expectNoContainerHorizontalScroll(
  locator: Locator,
  context = '',
): Promise<void> {
  const { scrollWidth, clientWidth } = await locator.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
  }));
  expect(
    scrollWidth - clientWidth,
    `contained horizontal scroll${context ? ` on ${context}` : ''} (scrollWidth ${scrollWidth} > clientWidth ${clientWidth})`,
  ).toBeLessThanOrEqual(TOLERANCE_PX);
}
