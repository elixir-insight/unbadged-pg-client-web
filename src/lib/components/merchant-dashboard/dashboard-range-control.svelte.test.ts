import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DashboardRangeControl from './dashboard-range-control.svelte';

describe('DashboardRangeControl', () => {
	it('marks the active preset and emits a range change', async () => {
		const onRangeChange = vi.fn();
		const screen = render(DashboardRangeControl, {
			range: '30d',
			onRangeChange
		});

		await expect
			.element(screen.getByRole('button', { name: '30D' }))
			.toHaveAttribute('aria-pressed', 'true');

		await screen.getByRole('button', { name: '7D' }).click();
		expect(onRangeChange).toHaveBeenCalledWith('7d');
	});
});
