import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import KycEmptyState from './kyc-empty-state.svelte';

describe('KycEmptyState', () => {
	it('renders the empty state placeholder', async () => {
		const screen = render(KycEmptyState);

		await expect.element(screen.getByText('No record yet')).toBeVisible();
		await expect
			.element(screen.getByText('Enter a number above and verify it to see the record here.'))
			.toBeVisible();
	});
});
