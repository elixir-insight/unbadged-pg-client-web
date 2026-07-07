import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import KycStatusBadge from './kyc-status-badge.svelte';

describe('KycStatusBadge', () => {
	it('renders Verified status', async () => {
		const screen = render(KycStatusBadge, { status: 'Verified' });

		await expect.element(screen.getByText('Verified')).toBeVisible();
	});

	it('renders Failed status', async () => {
		const screen = render(KycStatusBadge, { status: 'Failed' });

		await expect.element(screen.getByText('Failed')).toBeVisible();
	});
});
