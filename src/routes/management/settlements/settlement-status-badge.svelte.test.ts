import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SettlementStatusBadge from './settlement-status-badge.svelte';

describe('SettlementStatusBadge', () => {
	it('renders "Completed" for a completed settlement', async () => {
		const screen = render(SettlementStatusBadge, { status: 'completed' });

		await expect.element(screen.getByText('Completed')).toBeVisible();
	});

	it('renders "Pending" for a pending settlement', async () => {
		const screen = render(SettlementStatusBadge, { status: 'pending' });

		await expect.element(screen.getByText('Pending')).toBeVisible();
	});
});
