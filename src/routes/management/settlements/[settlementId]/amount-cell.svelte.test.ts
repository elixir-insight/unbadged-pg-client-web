import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AmountCell from './amount-cell.svelte';

describe('AmountCell', () => {
	it('renders the formatted amount as plain text by default', async () => {
		const screen = render(AmountCell, { formatted: '₹1,578' });

		await expect.element(screen.getByText('₹1,578')).toBeVisible();
		const span = screen.container.querySelector('span');
		expect(span?.className).not.toContain('text-destructive');
	});

	it('renders negative amounts with destructive/red styling', async () => {
		const screen = render(AmountCell, { formatted: '-₹4,484', negative: true });

		await expect.element(screen.getByText('-₹4,484')).toBeVisible();
		const span = screen.container.querySelector('span');
		expect(span?.className).toContain('text-destructive');
	});
});
