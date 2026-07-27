import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import BulkTransactionsTab from './bulk-transactions-tab.svelte';
import { mockBulkResult, mockBulkValidation, mockCsvFile } from './mock';

const { uploadBulkCsv, processBulkBatch, CheckStatusApiError } = vi.hoisted(() => ({
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

vi.mock('$lib/api/check-status', () => ({
	uploadBulkCsv,
	processBulkBatch,
	CheckStatusApiError
}));

async function uploadFile(screen: Awaited<ReturnType<typeof render>>, file: File) {
	const input = screen.container.querySelector('input[type="file"]') as HTMLInputElement;
	const dataTransfer = new DataTransfer();
	dataTransfer.items.add(file);
	input.files = dataTransfer.files;
	input.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('BulkTransactionsTab', () => {
	beforeEach(() => {
		uploadBulkCsv.mockReset();
		processBulkBatch.mockReset();
	});

	it('renders the empty upload state with identifier type and sample download', async () => {
		const screen = render(BulkTransactionsTab);

		await expect.element(screen.getByText('Identifier type')).toBeVisible();
		await expect
			.element(screen.getByText('Each row in your CSV should contain one UTR Number.'))
			.toBeVisible();
		await expect.element(screen.getByText('Drag and drop your CSV here')).toBeVisible();
		await expect.element(screen.getByText('CSV only · Max 1,000 rows')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Download Sample CSV' })).toBeVisible();
	});

	it('rejects non-CSV files with an inline error', async () => {
		const screen = render(BulkTransactionsTab);
		const invalidFile = new File(['data'], 'notes.txt', { type: 'text/plain' });

		await uploadFile(screen, invalidFile);

		await expect.element(screen.getByText('Only .csv files are accepted.')).toBeVisible();
		await expect.element(screen.getByText('Drag and drop your CSV here')).toBeVisible();
	});

	it('shows validation results after a successful CSV upload', async () => {
		const validation = mockBulkValidation({ valid: 2, invalid: 1, duplicates: 0, totalRows: 3 });
		uploadBulkCsv.mockResolvedValue(validation);

		const screen = render(BulkTransactionsTab);
		await uploadFile(screen, mockCsvFile());

		await expect.element(screen.getByText('File validated')).toBeVisible();
		await expect.element(screen.getByText('2 valid')).toBeVisible();
		await expect.element(screen.getByText('Valid', { exact: true })).toBeVisible();
		await expect.element(screen.getByText('Invalid', { exact: true })).toBeVisible();
		await expect.element(screen.getByText('Duplicates', { exact: true })).toBeVisible();
		await expect
			.element(screen.getByRole('button', { name: 'Check status for 2 transactions' }))
			.toBeVisible();
	});

	it('processes a validated batch and shows batch complete results', async () => {
		const validation = mockBulkValidation();
		const results = mockBulkResult();
		uploadBulkCsv.mockResolvedValue(validation);
		processBulkBatch.mockResolvedValue(results);

		const screen = render(BulkTransactionsTab);
		await uploadFile(screen, mockCsvFile());
		await expect.element(screen.getByText('File validated')).toBeVisible();

		await screen.getByRole('button', { name: 'Check status for 3 transactions' }).click();

		await expect.element(screen.getByText('Batch complete')).toBeVisible();
		await expect.element(screen.getByText('Success', { exact: true })).toBeVisible();
		await expect.element(screen.getByText('Failed', { exact: true })).toBeVisible();
		await expect.element(screen.getByText('Pending', { exact: true })).toBeVisible();
		await expect.element(screen.getByRole('link', { name: 'Download results CSV' })).toBeVisible();
	});

	it('shows an upload error and allows retry when upload fails', async () => {
		uploadBulkCsv.mockRejectedValue(
			new CheckStatusApiError('Upload failed. Please try again.', 500)
		);

		const screen = render(BulkTransactionsTab);
		await uploadFile(screen, mockCsvFile());

		await expect.element(screen.getByText('Upload failed. Please try again.')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Retry' })).toBeVisible();
	});

	it('resets to empty state when Replace file is clicked', async () => {
		const validation = mockBulkValidation();
		uploadBulkCsv.mockResolvedValue(validation);

		const screen = render(BulkTransactionsTab);
		await uploadFile(screen, mockCsvFile());
		await expect.element(screen.getByText('File validated')).toBeVisible();

		await screen.getByRole('button', { name: 'Replace file' }).click();

		await expect.element(screen.getByText('Drag and drop your CSV here')).toBeVisible();
	});
});
