import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TransactionTypeBadge from './transaction-type-badge.svelte';

describe('TransactionTypeBadge', () => {
	it('renders "Sale" for a sale transaction', async () => {
		const screen = render(TransactionTypeBadge, { type: 'sale' });

		await expect.element(screen.getByText('Sale')).toBeVisible();
	});

	it('renders "Refund" for a refund transaction', async () => {
		const screen = render(TransactionTypeBadge, { type: 'refund' });

		await expect.element(screen.getByText('Refund')).toBeVisible();
	});

	it('renders "Chargeback" for a chargeback transaction', async () => {
		const screen = render(TransactionTypeBadge, { type: 'chargeback' });

		await expect.element(screen.getByText('Chargeback')).toBeVisible();
	});
});
