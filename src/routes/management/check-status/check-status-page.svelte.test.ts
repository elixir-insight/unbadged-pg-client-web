import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CheckStatusPage from './+page.svelte';

vi.mock('$lib/api/check-status', () => ({
	checkTransactionStatus: vi.fn(),
	uploadBulkCsv: vi.fn(),
	processBulkBatch: vi.fn(),
	CheckStatusApiError: class CheckStatusApiError extends Error {
		status: number;
		constructor(message: string, status: number) {
			super(message);
			this.status = status;
		}
	}
}));

describe('CheckStatusPage', () => {
	it('renders the page header and description', async () => {
		const screen = render(CheckStatusPage);

		await expect.element(screen.getByRole('heading', { name: 'Check Status' })).toBeVisible();
		await expect
			.element(screen.getByText('Look up the status of one or many transactions.'))
			.toBeVisible();
	});

	it('renders both transaction mode tabs', async () => {
		const screen = render(CheckStatusPage);

		await expect.element(screen.getByRole('tab', { name: 'Single Transaction' })).toBeVisible();
		await expect.element(screen.getByRole('tab', { name: 'Bulk Transactions' })).toBeVisible();
	});

	it('shows the single transaction search form by default', async () => {
		const screen = render(CheckStatusPage);

		await expect.element(screen.getByText('Search By')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Check Status' })).toBeVisible();
	});

	it('switches to the bulk upload panel when Bulk Transactions is selected', async () => {
		const screen = render(CheckStatusPage);

		await screen.getByRole('tab', { name: 'Bulk Transactions' }).click();

		await expect.element(screen.getByText('Identifier type')).toBeVisible();
		await expect.element(screen.getByText('Drag and drop your CSV here')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Download Sample CSV' })).toBeVisible();
	});

	it('switches back to the single transaction form from bulk tab', async () => {
		const screen = render(CheckStatusPage);

		await screen.getByRole('tab', { name: 'Bulk Transactions' }).click();
		await expect.element(screen.getByText('Drag and drop your CSV here')).toBeVisible();

		await screen.getByRole('tab', { name: 'Single Transaction' }).click();

		await expect.element(screen.getByText('Search By')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Check Status' })).toBeVisible();
	});
});
