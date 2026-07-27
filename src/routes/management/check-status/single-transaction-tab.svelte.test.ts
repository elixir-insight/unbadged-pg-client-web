import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import SingleTransactionTab from './single-transaction-tab.svelte';
import { mockSingleResult, SINGLE_TRANSACTION_DEMO_KEYS } from './mock';
import { formatInr } from '$lib/types/check-status';

const { checkTransactionStatus, CheckStatusApiError } = vi.hoisted(() => ({
	checkTransactionStatus: vi.fn(),
	CheckStatusApiError: class CheckStatusApiError extends Error {
		status: number;
		constructor(message: string, status: number) {
			super(message);
			this.status = status;
		}
	}
}));

vi.mock('$lib/api/check-status', () => ({
	checkTransactionStatus,
	CheckStatusApiError
}));

describe('SingleTransactionTab', () => {
	beforeEach(() => {
		checkTransactionStatus.mockReset();
	});

	it('renders the search form with Search By dropdown and disabled submit', async () => {
		const screen = render(SingleTransactionTab);

		await expect.element(screen.getByText('Search By')).toBeVisible();
		await expect.element(screen.getByLabelText('UTR Number')).toBeVisible();
		await expect.element(screen.getByPlaceholder('Enter UTR Number')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Check Status' })).toBeDisabled();
	});

	it('enables Check Status when a search value is entered', async () => {
		const screen = render(SingleTransactionTab);

		await screen.getByPlaceholder('Enter UTR Number').fill(SINGLE_TRANSACTION_DEMO_KEYS.success);

		await expect.element(screen.getByRole('button', { name: 'Check Status' })).not.toBeDisabled();
	});

	it('renders a successful transaction result with formatted fields', async () => {
		const result = mockSingleResult('success');
		checkTransactionStatus.mockResolvedValue(result);

		const screen = render(SingleTransactionTab);
		await screen.getByPlaceholder('Enter UTR Number').fill(SINGLE_TRANSACTION_DEMO_KEYS.success);
		await screen.getByRole('button', { name: 'Check Status' }).click();

		await expect.element(screen.getByText('Transaction Found')).toBeVisible();
		await expect.element(screen.getByText('Success')).toBeVisible();
		await expect.element(screen.getByText(result.transactionId)).toBeVisible();
		await expect.element(screen.getByText(formatInr(result.amount))).toBeVisible();
		await expect.element(screen.getByText(result.merchantName)).toBeVisible();
	});

	it('renders failure reason for a failed transaction', async () => {
		const result = mockSingleResult('failed');
		checkTransactionStatus.mockResolvedValue(result);

		const screen = render(SingleTransactionTab);
		await screen.getByPlaceholder('Enter UTR Number').fill(SINGLE_TRANSACTION_DEMO_KEYS.failed);
		await screen.getByRole('button', { name: 'Check Status' }).click();

		await expect.element(screen.getByText('Failed')).toBeVisible();
		await expect.element(screen.getByText(result.failureReason!)).toBeVisible();
	});

	it('shows pending status styling for a pending transaction', async () => {
		const result = mockSingleResult('pending');
		checkTransactionStatus.mockResolvedValue(result);

		const screen = render(SingleTransactionTab);
		await screen.getByPlaceholder('Enter UTR Number').fill(SINGLE_TRANSACTION_DEMO_KEYS.pending);
		await screen.getByRole('button', { name: 'Check Status' }).click();

		await expect.element(screen.getByText('Pending')).toBeVisible();
		await expect.element(screen.getByText(result.merchantName)).toBeVisible();
	});

	it('shows a not-found empty state when the API returns 404', async () => {
		checkTransactionStatus.mockRejectedValue(
			new CheckStatusApiError('No matching transaction found', 404)
		);

		const screen = render(SingleTransactionTab);
		await screen.getByPlaceholder('Enter UTR Number').fill('UNKNOWN-TXN');
		await screen.getByRole('button', { name: 'Check Status' }).click();

		await expect.element(screen.getByText('No transaction found')).toBeVisible();
	});

	it('shows an inline error when the API returns a server error', async () => {
		checkTransactionStatus.mockRejectedValue(new CheckStatusApiError('Server unavailable', 500));

		const screen = render(SingleTransactionTab);
		await screen.getByPlaceholder('Enter UTR Number').fill(SINGLE_TRANSACTION_DEMO_KEYS.success);
		await screen.getByRole('button', { name: 'Check Status' }).click();

		await expect.element(screen.getByText('Server unavailable')).toBeVisible();
		await expect
			.element(screen.getByPlaceholder('Enter UTR Number'))
			.toHaveValue(SINGLE_TRANSACTION_DEMO_KEYS.success);
	});

	it('clears the result when the clear button is clicked', async () => {
		const result = mockSingleResult('success');
		checkTransactionStatus.mockResolvedValue(result);

		const screen = render(SingleTransactionTab);
		const input = screen.getByPlaceholder('Enter UTR Number');
		await input.fill(SINGLE_TRANSACTION_DEMO_KEYS.success);
		await screen.getByRole('button', { name: 'Check Status' }).click();
		await expect.element(screen.getByText('Transaction Found')).toBeVisible();

		await screen.getByRole('button', { name: 'Clear search' }).click();

		await expect.element(input).toHaveValue('');
		expect(screen.container.textContent).not.toContain('Transaction Found');
	});
});
