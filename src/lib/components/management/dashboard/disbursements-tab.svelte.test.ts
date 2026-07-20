import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DisbursementsTab from './disbursements-tab.svelte';

describe('DisbursementsTab', () => {
	it('renders the coming soon message', async () => {
		const screen = render(DisbursementsTab);

		await expect.element(screen.getByText('Disbursement Dashboard Coming soon.')).toBeVisible();
	});
});
