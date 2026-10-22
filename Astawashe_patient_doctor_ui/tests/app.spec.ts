import { expect, test, type Page } from '@playwright/test';

/**
 * The app derives "upcoming" vs "unconfirmed" from the clock, so every test
 * pins it to 1:30 PM today. Seed records (src/data/mockData.ts) leave
 * Almaz's 12:00 Amlodipine unanswered and her 6:00 PM Vitamin D3 upcoming.
 */
async function setup(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  const now = new Date();
  now.setHours(13, 30, 0, 0);
  await page.clock.setFixedTime(now);
  return errors;
}

const DEV_TERMS = /\b(demo|mock|prototype|simulat\w*|sample|placeholder|fictional|test ?case)\b/i;

async function expectNoDevTerms(page: Page) {
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(DEV_TERMS);
}

test.describe('navigation', () => {
  test('account chooser opens each experience and Switch account returns', async ({ page }) => {
    const errors = await setup(page);
    await page.goto('/');
    await expectNoDevTerms(page);
    await page.getByRole('link', { name: /Almaz Tesfaye/ }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Good afternoon, Almaz');
    await page.getByRole('link', { name: /Switch account/ }).click();
    await page.getByRole('link', { name: /Dr\. Selam Worku/ }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Good afternoon, Dr. Selam Worku');
    await page.goto('/nope');
    await expect(page).toHaveURL('/');
    expect(errors).toEqual([]);
  });
});

test.describe('patient', () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
    await page.goto('/patient');
  });

  test('shows schedule with all dose states and no development wording', async ({ page }) => {
    await expect(page.getByText('1 of 4 doses taken today, 1 waiting for your answer')).toBeVisible();
    const badge = (t: string) => page.locator('ol span.rounded-full', { hasText: new RegExp(`^${t}$`) });
    await expect(badge('Taken')).toHaveCount(1);
    await expect(badge('Unconfirmed')).toHaveCount(1);
    await expect(badge('Upcoming')).toHaveCount(2);
    for (const tab of ['Today', 'Medications', 'History', 'Reminders', 'Care team']) {
      await page.getByRole('tab', { name: new RegExp(`^${tab}`) }).click();
      await expectNoDevTerms(page);
    }
  });

  test('confirms an unanswered dose, then undoes it', async ({ page }) => {
    await page.getByRole('button', { name: 'Yes, I took it' }).click();
    await expect(page.getByRole('status')).toContainText('Amlodipine 5 mg at 12:00 PM marked as taken.');
    await expect(page.getByText('2 of 4 doses taken today')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Did you take/ })).toHaveCount(0);
    await page.getByRole('status').getByRole('button', { name: 'Undo' }).click();
    await expect(page.getByText('1 of 4 doses taken today, 1 waiting for your answer')).toBeVisible();
  });

  test('answers the next dose from the spoken reminder', async ({ page }) => {
    await page.getByRole('button', { name: 'Hear reminder', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Vitamin D3 1000 IU');
    await dialog.getByRole('button', { name: /1\s*I took it/ }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText('2 of 4 doses taken today')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Next dose' }).locator('..')).toContainText('8:00 PM');
  });

  test('text-menu reminder validates the reply', async ({ page }) => {
    await page.getByRole('tab', { name: 'Reminders' }).click();
    const save = page.getByRole('button', { name: 'Save preferences' });
    await expect(save).toBeDisabled();
    await page.getByText('Text menu', { exact: true }).click();
    await save.click();
    await expect(page.getByRole('status')).toContainText('Reminder preferences saved.');
    await page.getByRole('tab', { name: /^Today/ }).click();
    await page.getByRole('button', { name: 'Open reminder' }).click();
    const reply = page.getByLabel('Your reply');
    await reply.fill('3');
    await page.getByRole('button', { name: 'Send reply' }).click();
    await expect(page.getByText('Reply with 1 or 2.')).toBeVisible();
    await reply.fill('2');
    await page.getByRole('button', { name: 'Send reply' }).click();
    await expect(page.getByRole('status')).toContainText('Vitamin D3 1000 IU at 6:00 PM marked as not taken.');
  });

  test('history filters by status and range', async ({ page }) => {
    await page.getByRole('tab', { name: 'History' }).click();
    await page.getByLabel('Show').selectOption('MISSED');
    const badges = page.locator('main section li span.rounded-full');
    const texts = await badges.allInnerTexts();
    expect(texts.length).toBeGreaterThan(0);
    expect(new Set(texts.map((t) => t.trim()))).toEqual(new Set(['Missed']));
    await page.getByText('Last 14 days').click();
    expect(await badges.count()).toBeGreaterThanOrEqual(texts.length);
  });

  test('patient cannot change prescriptions', async ({ page }) => {
    await page.getByRole('tab', { name: 'Medications' }).click();
    await expect(page.getByRole('button', { name: /edit|stop|add prescription/i })).toHaveCount(0);
    await page.getByRole('button', { name: /Metformin 500 mg/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('8:00 AM, 8:00 PM');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
  });

  test('sends a message to the care team and rejects empty ones', async ({ page }) => {
    await page.getByRole('tab', { name: 'Care team' }).click();
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByText('Write a message before sending.')).toBeVisible();
    await page.getByLabel(/Message to/).fill('My new prescription bottle arrived.');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByRole('log')).toContainText('My new prescription bottle arrived.');
  });
});

test.describe('doctor', () => {
  test.beforeEach(async ({ page }) => {
    await setup(page);
    await page.goto('/doctor');
  });

  test('searches and filters the patient list', async ({ page }) => {
    await page.getByRole('tab', { name: 'Patients' }).click();
    await expect(page.getByText('6 of 6 patients')).toBeVisible();
    await page.getByLabel('Search patients').fill('bek');
    await expect(page.getByText('1 of 6 patients')).toBeVisible();
    await expect(page.getByRole('row', { name: /Bekele Girma/ })).toBeVisible();
    await page.getByLabel('Search patients').fill('zzz');
    await expect(page.getByText('No patients match')).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await page.getByText('Follow up', { exact: true }).first().click();
    const rows = page.locator('tbody tr');
    const n = await rows.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) await expect(rows.nth(i)).toContainText('Follow up');
  });

  test('adds, edits and stops a prescription with validation', async ({ page }) => {
    await page.getByRole('tab', { name: 'Patients' }).click();
    await page.getByRole('row', { name: /Hanna Mekonnen/ }).click();
    const panel = page.getByRole('dialog', { name: 'Hanna Mekonnen' });
    await panel.getByRole('tab', { name: 'Prescriptions' }).click();
    await panel.getByRole('button', { name: 'Add prescription' }).click();

    const form = page.getByRole('dialog', { name: 'New prescription' });
    await form.getByRole('button', { name: 'Add prescription' }).click();
    await expect(form.getByText('Enter the medication name.')).toBeVisible();
    await expect(form.getByText(/Enter the dose/)).toBeVisible();

    await form.getByLabel('Medication').fill('Omeprazole');
    await form.getByLabel('Dose', { exact: true }).fill('twenty');
    await form.getByRole('button', { name: 'Add prescription' }).click();
    await expect(form.getByText(/should include an amount/)).toBeVisible();
    await form.getByLabel('Dose', { exact: true }).fill('20 mg');
    await form.getByText('Every N hours').click();
    await form.getByLabel('Repeat every').selectOption('12');
    await expect(form).toContainText('06:00, 18:00');
    await form.getByRole('button', { name: 'Add prescription' }).click();
    await expect(form).toHaveCount(0);
    await expect(page.getByRole('status')).toContainText('Added Omeprazole 20 mg for Hanna.');
    await expect(panel).toContainText('Omeprazole 20 mg');

    await panel.getByRole('button', { name: 'Edit Omeprazole' }).click();
    const edit = page.getByRole('dialog', { name: 'Edit prescription' });
    await edit.getByLabel('Dose', { exact: true }).fill('40 mg');
    await edit.getByRole('button', { name: 'Save changes' }).click();
    await expect(panel).toContainText('Omeprazole 40 mg');

    await panel.getByRole('button', { name: 'Stop Omeprazole' }).click();
    await page.getByRole('dialog', { name: /Stop Omeprazole/ }).getByRole('button', { name: 'Stop prescription' }).click();
    await expect(panel.getByText('Stopped', { exact: true })).toBeVisible();
    await expectNoDevTerms(page);
  });

  test('records a phone confirmation and reviews alerts', async ({ page }) => {
    const alertsTab = page.getByRole('tab', { name: /Alerts/ });
    const before = Number((await alertsTab.innerText()).match(/\d+/)?.[0]);
    await alertsTab.click();
    await page.getByRole('button', { name: 'Mark reviewed' }).first().click();
    await expect(alertsTab).toContainText(String(before - 1));
    await expect(page.getByRole('button', { name: /re-send/i })).toHaveCount(0);

    await page.getByRole('button', { name: 'Almaz Tesfaye' }).first().click();
    const panel = page.getByRole('dialog', { name: 'Almaz Tesfaye' });
    await panel.getByRole('button', { name: 'Record phone confirmation' }).click();
    await expect(page.getByRole('status')).toContainText('confirmed by phone');
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
  });

  test('messages a patient from the conversation list', async ({ page }) => {
    await page.getByRole('tab', { name: /Messages/ }).click();
    await page.getByRole('button', { name: /Getachew Abebe/ }).click();
    const panel = page.getByRole('dialog', { name: 'Getachew Abebe' });
    await panel.getByLabel(/Message to/).fill('We can move that reminder earlier.');
    await panel.getByRole('button', { name: 'Send' }).click();
    await expect(panel.getByRole('log')).toContainText('We can move that reminder earlier.');
  });
});

test.describe('responsive @mobile', () => {
  for (const path of ['/', '/patient', '/doctor']) {
    test(`no horizontal scrolling on ${path} @mobile`, async ({ page }) => {
      const errors = await setup(page);
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }

  test('doctor patient list is usable on a phone @mobile', async ({ page }) => {
    await setup(page);
    await page.goto('/doctor');
    await page.getByRole('tab', { name: 'Patients' }).click();
    await page.getByRole('button', { name: /Yonas Haile/ }).click();
    await expect(page.getByRole('dialog', { name: 'Yonas Haile' })).toBeVisible();
  });
});
