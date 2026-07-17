import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import StatusDistributionCard, { type StatusDatum } from './status-distribution-card.svelte';

const data: StatusDatum[] = [
	{ label: 'In progress', amount: 380, percentage: 41, color: 'var(--chart-3)' },
	{ label: 'In review', amount: 210, percentage: 23, color: 'var(--chart-1)' },
	{ label: 'Remarked', amount: 340, percentage: 37, color: 'var(--chart-2)' }
];

describe('StatusDistributionCard', () => {
	it('renders the title and description', async () => {
		const screen = render(StatusDistributionCard, {
			title: 'Organization Status — Pre Approval',
			description: 'Last 30 days',
			data
		});

		await expect.element(screen.getByText('Organization Status — Pre Approval')).toBeVisible();
		await expect.element(screen.getByText('Last 30 days')).toBeVisible();
	});

	it('renders a legend entry with percentage and amount for every status', async () => {
		const screen = render(StatusDistributionCard, { title: 'Status', data });

		for (const item of data) {
			await expect.element(screen.getByText(item.label)).toBeVisible();
			await expect.element(screen.getByText(`${item.percentage}%`)).toBeVisible();
			await expect.element(screen.getByText(`(${item.amount})`)).toBeVisible();
		}
	});

	it('hides the amount when showAmount is false', async () => {
		const screen = render(StatusDistributionCard, { title: 'Status', data, showAmount: false });

		expect(screen.container.textContent).not.toContain('(380)');
	});

	it('renders the total using the default label and formatter', async () => {
		const screen = render(StatusDistributionCard, { title: 'Status', data });

		await expect.element(screen.getByText('Total')).toBeVisible();
		await expect.element(screen.getByText('930')).toBeVisible();
	});

	it('renders a custom total label and formatted value', async () => {
		const screen = render(StatusDistributionCard, {
			title: 'Status',
			data,
			totalLabel: 'Pre-Approval',
			formatValue: (v: number) => `₹ ${v.toLocaleString('en-IN')}`
		});

		await expect.element(screen.getByText('Pre-Approval')).toBeVisible();
		await expect.element(screen.getByText('₹ 930')).toBeVisible();
	});
});
