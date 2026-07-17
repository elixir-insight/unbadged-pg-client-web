import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import RefundsDisputesCard from './refunds-disputes-card.svelte';

function baseProps(overrides: Record<string, unknown> = {}) {
	return {
		open: 4,
		pending: 3,
		resolved: 8,
		avgResolutionTime: '2d 4h',
		...overrides
	};
}

describe('RefundsDisputesCard', () => {
	it('renders the section heading', async () => {
		const screen = render(RefundsDisputesCard, baseProps());

		await expect.element(screen.getByText('Dispute overview')).toBeVisible();
	});

	it('renders the total of open, pending, and resolved disputes', async () => {
		const screen = render(RefundsDisputesCard, baseProps());

		await expect.element(screen.getByText('15')).toBeVisible();
		await expect.element(screen.getByText('total')).toBeVisible();
	});

	it('renders each status label and value', async () => {
		const screen = render(RefundsDisputesCard, baseProps());

		await expect.element(screen.getByText('Open')).toBeVisible();
		await expect.element(screen.getByText('4', { exact: true })).toBeVisible();
		await expect.element(screen.getByText('Pending')).toBeVisible();
		await expect.element(screen.getByText('3', { exact: true })).toBeVisible();
		await expect.element(screen.getByText('Resolved')).toBeVisible();
		await expect.element(screen.getByText('8', { exact: true })).toBeVisible();
	});

	it('renders the average resolution time', async () => {
		const screen = render(RefundsDisputesCard, baseProps());

		await expect.element(screen.getByText('Avg. resolution time')).toBeVisible();
		await expect.element(screen.getByText('2d 4h')).toBeVisible();
	});

	it('renders a total of zero when all counts are zero', async () => {
		const screen = render(RefundsDisputesCard, baseProps({ open: 0, pending: 0, resolved: 0 }));

		await expect.element(screen.getByText('0', { exact: true }).first()).toBeVisible();
	});
});
