import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { getLocalTimeZone, today } from '@internationalized/date';
import SettlementDatePicker from './settlement-date-picker.svelte';

describe('SettlementDatePicker', () => {
	it('labels today\'s date as "Today"', async () => {
		const screen = render(SettlementDatePicker, { value: today(getLocalTimeZone()) });

		await expect.element(screen.getByText(/Today/)).toBeVisible();
	});

	it('labels yesterday\'s date as "Yesterday"', async () => {
		const yesterday = today(getLocalTimeZone()).subtract({ days: 1 });
		const screen = render(SettlementDatePicker, { value: yesterday });

		await expect.element(screen.getByText(/Yesterday/)).toBeVisible();
	});

	it('shows a plain formatted date for dates other than today/yesterday', async () => {
		const someDate = today(getLocalTimeZone()).subtract({ days: 10 });
		const screen = render(SettlementDatePicker, { value: someDate });
		const trigger = screen.container.querySelector('button');

		expect(trigger?.textContent).not.toContain('Today');
		expect(trigger?.textContent).not.toContain('Yesterday');
	});
});
