import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FundsSummaryCard, { type VirtualAccountSummary } from './funds-summary-card.svelte';

const accounts: VirtualAccountSummary[] = [
	{ label: 'Primary VA', accountNumber: '1234567890', balance: '₹2,10,000', tone: 'primary' },
	{ label: 'Escrow VA', accountNumber: '0987654321', balance: '₹1,42,300', tone: 'info' }
];

function baseProps(overrides: Record<string, unknown> = {}) {
	return {
		accounts,
		activeAccounts: 2,
		pendingKyc: 1,
		totalBalance: '₹3,52,300',
		...overrides
	};
}

describe('FundsSummaryCard', () => {
	it('renders the section heading', async () => {
		const screen = render(FundsSummaryCard, baseProps());

		await expect.element(screen.getByText('Virtual accounts')).toBeVisible();
	});

	it('renders every account label and balance', async () => {
		const screen = render(FundsSummaryCard, baseProps());

		for (const account of accounts) {
			await expect.element(screen.getByText(account.label)).toBeVisible();
			await expect.element(screen.getByText(account.balance)).toBeVisible();
		}
	});

	it('renders the accounts, active, and pending KYC summary line', async () => {
		const screen = render(FundsSummaryCard, baseProps());

		await expect.element(screen.getByText('2 cards · 2 active · 1 pending KYC')).toBeVisible();
	});

	it('renders the total balance and default change label', async () => {
		const screen = render(FundsSummaryCard, baseProps());

		await expect.element(screen.getByText('₹3,52,300')).toBeVisible();
		await expect.element(screen.getByText('+32.8%')).toBeVisible();
	});

	it('renders a custom balance change label', async () => {
		const screen = render(FundsSummaryCard, baseProps({ balanceChangeLabel: '-5.0%' }));

		await expect.element(screen.getByText('-5.0%')).toBeVisible();
	});

	it('renders a link to the funds page', async () => {
		const screen = render(FundsSummaryCard, baseProps());
		const link = screen.container.querySelector('a[href="/merchant/funds"]');

		expect(link).not.toBeNull();
		expect(link?.textContent).toContain('View all');
	});

	it('renders no account rows when accounts is empty', async () => {
		const screen = render(FundsSummaryCard, baseProps({ accounts: [], activeAccounts: 0 }));

		await expect.element(screen.getByText('0 cards · 0 active · 1 pending KYC')).toBeVisible();
	});
});
