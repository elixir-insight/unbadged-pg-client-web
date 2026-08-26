import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import WebhookUrlSection from './webhook-url-section.svelte';
import type { WebhookUrlRow } from './webhook-logic';

const sampleRow: WebhookUrlRow = {
	id: 'hook-1',
	eventType: 'PAYIN',
	webhookUrl: 'https://example.com/hooks/a',
	isActive: true,
	createdAt: '2026-01-01T00:00:00.000Z'
};

beforeEach(() => {
	window.history.replaceState({}, '', '/partner/settings');
});

describe('WebhookUrlSection ΓÇö empty list', () => {
	it('shows the empty-state copy', async () => {
		const screen = render(WebhookUrlSection, { webhookUrls: [] });

		await expect.element(screen.getByText('No webhooks configured yet.')).toBeVisible();
	});

	it('still shows the Add Webhook button ΓÇö not a one-time flow', async () => {
		const screen = render(WebhookUrlSection, { webhookUrls: [] });

		await expect.element(screen.getByText('Add Webhook')).toBeVisible();
	});
});

describe('WebhookUrlSection ΓÇö populated list', () => {
	it('renders the eventType and an Active status badge', async () => {
		const screen = render(WebhookUrlSection, { webhookUrls: [sampleRow] });

		await expect.element(screen.getByText('PAYIN', { exact: true })).toBeVisible();
		await expect.element(screen.getByText('Active')).toBeVisible();
	});

	it('keeps the Add Webhook button available alongside existing rows', async () => {
		const screen = render(WebhookUrlSection, { webhookUrls: [sampleRow] });

		await expect.element(screen.getByText('Add Webhook')).toBeVisible();
	});

	it('opens the edit modal with existing values and a blank secret', async () => {
		const screen = render(WebhookUrlSection, { webhookUrls: [sampleRow] });

		await screen.getByRole('button', { name: 'Edit' }).click();

		await expect.element(screen.getByRole('heading', { name: 'Edit Webhook' })).toBeVisible();
		await expect.element(screen.getByLabelText('Webhook event type')).toHaveTextContent('PAYIN');
		await expect.element(screen.getByLabelText(/Webhook URL/)).toHaveValue(sampleRow.webhookUrl);
		await expect
			.element(screen.getByRole('switch', { name: 'Webhook active status' }))
			.toBeChecked();
		await expect.element(screen.getByLabelText(/Secret Key/)).toHaveValue('');
		await expect.element(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
	});

	it('clears secretKey whenever the edit modal is reopened', async () => {
		const screen = render(WebhookUrlSection, { webhookUrls: [sampleRow] });

		await screen.getByRole('button', { name: 'Edit' }).click();
		await expect.element(screen.getByRole('heading', { name: 'Edit Webhook' })).toBeVisible();
		await screen.getByLabelText(/Secret Key/).fill('temporary-secret');
		await screen.getByRole('button', { name: 'Close' }).click();
		await expect
			.element(screen.getByRole('heading', { name: 'Edit Webhook' }))
			.not.toBeInTheDocument();

		await screen.getByRole('button', { name: 'Edit' }).click();
		await expect.element(screen.getByRole('heading', { name: 'Edit Webhook' })).toBeVisible();
		await expect.element(screen.getByLabelText(/Secret Key/)).toHaveValue('');
	});

	it('rejects an invalid edited webhook URL client-side', async () => {
		const screen = render(WebhookUrlSection, { webhookUrls: [sampleRow] });

		await screen.getByRole('button', { name: 'Edit' }).click();
		await screen.getByLabelText(/Webhook URL/).fill('https:// srtech@gmail.com');

		await expect.element(screen.getByText('Enter a valid http:// or https:// URL.')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
	});

	it('renders multiple webhooks sharing the same eventType', async () => {
		const second: WebhookUrlRow = { ...sampleRow, id: 'hook-2', isActive: false };
		const screen = render(WebhookUrlSection, { webhookUrls: [sampleRow, second] });

		await expect.element(screen.getByText('Active', { exact: true })).toBeVisible();
		await expect.element(screen.getByText('Inactive', { exact: true })).toBeVisible();
	});

	it('paginates webhook rows in groups of five', async () => {
		const rows = Array.from({ length: 6 }, (_, index): WebhookUrlRow => ({
			...sampleRow,
			id: `hook-${index + 1}`,
			webhookUrl: `https://example.com/hooks/${index + 1}`
		}));
		const screen = render(WebhookUrlSection, { webhookUrls: rows });

		await expect.element(screen.getByText('https://example.com/hooks/1').first()).toBeVisible();
		await expect.element(screen.getByText('https://example.com/hooks/6')).not.toBeInTheDocument();

		await screen.getByRole('button', { name: 'Go to next page' }).click();

		await expect.element(screen.getByText('https://example.com/hooks/6').first()).toBeVisible();
		await expect.element(screen.getByText('https://example.com/hooks/1')).not.toBeInTheDocument();
		expect(new URL(window.location.href).searchParams.get('page')).toBe('2');
	});

	it('filters rows by event type without case sensitivity', async () => {
		const payinRow = { ...sampleRow, eventType: 'payin', webhookUrl: 'https://example.com/payin' };
		const payoutRow = {
			...sampleRow,
			id: 'hook-2',
			eventType: 'PAYOUT',
			webhookUrl: 'https://example.com/payout'
		};
		const screen = render(WebhookUrlSection, { webhookUrls: [payinRow, payoutRow] });

		await screen.getByLabelText('Filter by event type').click();
		await screen.getByRole('option', { name: 'PAYOUT' }).click();

		// Prefer the table cell; Tooltip content can mount the same URL text in a portal.
		await expect.element(screen.getByText('https://example.com/payout').first()).toBeVisible();
		await expect.element(screen.getByText('https://example.com/payin')).not.toBeInTheDocument();
		await expect.element(screen.getByLabelText('Filter by event type')).toHaveTextContent('PAYOUT');
		expect(new URL(window.location.href).searchParams.get('eventType')).toBe('PAYOUT');
	});
});

describe('WebhookUrlSection ΓÇö load error', () => {
	it('shows a retryable error banner instead of the table', async () => {
		const screen = render(WebhookUrlSection, {
			webhookUrls: [],
			loadError: 'Could not load your webhook URLs. Please try again.'
		});

		await expect
			.element(screen.getByText('Could not load your webhook URLs. Please try again.'))
			.toBeVisible();
		expect(screen.container.textContent).not.toContain('No webhooks configured yet.');
	});
});
