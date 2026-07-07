import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import KycTabBar from './kyc-tab-bar.svelte';

function renderTabBar(
	overrides: {
		tab?: 'aadhaar' | 'pan';
		onchange?: (next: 'aadhaar' | 'pan') => void;
	} = {}
) {
	return render(KycTabBar, {
		tab: 'aadhaar',
		...overrides
	});
}

describe('KycTabBar', () => {
	it('renders Aadhaar and PAN tabs', async () => {
		const screen = renderTabBar();

		await expect.element(screen.getByRole('button', { name: 'Aadhaar' })).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'PAN' })).toBeVisible();
	});

	it('calls onchange when PAN tab is clicked', async () => {
		const onchange = vi.fn();
		const screen = renderTabBar({ onchange });

		await screen.getByRole('button', { name: 'PAN' }).click();

		expect(onchange).toHaveBeenCalledWith('pan');
	});
});
