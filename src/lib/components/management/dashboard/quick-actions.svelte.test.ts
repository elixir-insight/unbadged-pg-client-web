import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import QuickActions, { type QuickAction } from './quick-actions.svelte';
import { Table2, Download, Landmark } from '$lib/assets/icons';

const actions: QuickAction[] = [
	{
		id: 'transactions',
		label: 'Transactions',
		description: 'Browse every collection transaction and filter by bank or status',
		icon: Table2,
		href: '/management/transactions',
		tone: 'violet'
	},
	{
		id: 'download-report',
		label: 'Download report',
		description: 'Export the collections summary for this period',
		icon: Download,
		href: '/management/reports',
		tone: 'amber'
	},
	{
		id: 'settlements',
		label: 'Settlements',
		description: 'Track settlement batches and reconcile against bank payouts',
		icon: Landmark,
		href: '/management/settlements',
		tone: 'emerald'
	}
];

describe('QuickActions', () => {
	it('renders a link for every action with its label and description', async () => {
		const screen = render(QuickActions, { actions });

		for (const action of actions) {
			await expect.element(screen.getByText(action.label)).toBeVisible();
			await expect.element(screen.getByText(action.description)).toBeVisible();
		}
	});

	it('resolves each action href to a real anchor link', async () => {
		const screen = render(QuickActions, { actions });

		for (const action of actions) {
			const link = screen.container.querySelector(`a[href="${action.href}"]`);
			expect(link).not.toBeNull();
		}
	});

	it('renders as a vertical list by default', async () => {
		const screen = render(QuickActions, { actions });

		expect(screen.container.querySelector('.flex.flex-col')).not.toBeNull();
	});

	it('renders as a grid when layout is grid', async () => {
		const screen = render(QuickActions, { actions, layout: 'grid' });

		expect(screen.container.querySelector('.grid')).not.toBeNull();
	});
});
