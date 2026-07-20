import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SettlementsCard from './settlements-card.svelte';

function baseProps(overrides: Record<string, unknown> = {}) {
	return {
		availableFunds: '₹4,52,300',
		pendingSettlement: '₹1,20,000',
		lastSettlementAmount: '₹98,500',
		...overrides
	};
}

describe('SettlementsCard', () => {
	it('renders the section heading', async () => {
		const screen = render(SettlementsCard, baseProps());

		await expect.element(screen.getByText('Settlement insights')).toBeVisible();
	});

	it('renders the available funds amount and default change label', async () => {
		const screen = render(SettlementsCard, baseProps());

		await expect.element(screen.getByText('₹4,52,300')).toBeVisible();
		await expect.element(screen.getByText('+4.2%')).toBeVisible();
	});

	it('renders a custom available funds change label', async () => {
		const screen = render(SettlementsCard, baseProps({ availableFundsChangeLabel: '-1.1%' }));

		await expect.element(screen.getByText('-1.1%')).toBeVisible();
	});

	it('renders the pending settlement amount', async () => {
		const screen = render(SettlementsCard, baseProps());

		await expect.element(screen.getByText('Pending settlement')).toBeVisible();
		await expect.element(screen.getByText('₹1,20,000')).toBeVisible();
	});

	it('renders the last settlement amount with a success chip by default', async () => {
		const screen = render(SettlementsCard, baseProps());

		await expect.element(screen.getByText('Last settled')).toBeVisible();
		await expect.element(screen.getByText('₹98,500')).toBeVisible();
		await expect.element(screen.getByText('Success')).toBeVisible();
	});

	it('renders a pending chip when lastSettlementStatus is pending', async () => {
		const screen = render(SettlementsCard, baseProps({ lastSettlementStatus: 'pending' }));

		await expect.element(screen.getByText('Pending', { exact: true })).toBeVisible();
	});

	it('renders a link to the settlements page', async () => {
		const screen = render(SettlementsCard, baseProps());
		const link = screen.container.querySelector('a[href="/merchant/settlements"]');

		expect(link).not.toBeNull();
		expect(link?.textContent).toContain('View all Settlements');
	});
});
