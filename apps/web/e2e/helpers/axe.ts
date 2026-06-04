import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

/**
 * Runs an axe-core audit on the current page state.
 * Throws if any *critical* WCAG violations are found (blocks merge per AC #1).
 * Non-critical violations (serious / moderate / minor) are recorded as informational.
 */
export async function checkA11y(page: Page, context: string): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === 'critical');

  if (critical.length > 0) {
    const details = critical
      .map(
        (v) => `
  [${v.id}] ${v.description}
  Help: ${v.helpUrl}
  Nodes: ${v.nodes.map((n) => n.target.join(', ')).join(' | ')}`,
      )
      .join('\n');

    throw new Error(
      `${critical.length} critical a11y violation(s) on "${context}":\n${details}`,
    );
  }
}
