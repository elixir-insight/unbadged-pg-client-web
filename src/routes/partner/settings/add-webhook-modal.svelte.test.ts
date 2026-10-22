import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import AddWebhookModal from './add-webhook-modal.svelte';

describe('AddWebhookModal', () => {
	it('renders all three fields plus a submit button', async () => {
		const screen = render(AddWebhookModal, { open: true });

		await expect.element(screen.getByLabelText('Webhook event type')).toBeVisible();
		await expect.element(screen.getByLabelText(/Webhook URL/)).toBeVisible();
		await expect.element(screen.getByLabelText(/Secret Key/)).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Add Webhook' })).toBeVisible();
	});

	it('masks the secret key by default and can toggle it to plain text', async () => {
		const screen = render(AddWebhookModal, { open: true });

		const secretInput = screen.getByLabelText(/Secret Key/);
		await expect.element(secretInput).toHaveAttribute('type', 'password');

		await screen.getByLabelText('Show secret key').click();
		await expect.element(secretInput).toHaveAttribute('type', 'text');
	});

	it('rejects a malformed webhook URL client-side before allowing submit', async () => {
		const screen = render(AddWebhookModal, { open: true });

		await screen.getByLabelText('Webhook event type').click();
		await screen.getByRole('option', { name: 'PAYIN' }).click();
		await screen.getByLabelText(/Webhook URL/).fill('not-a-url');
		await screen.getByLabelText(/Secret Key/).fill('shh-secret');

		await expect.element(screen.getByText('Enter a valid http:// or https:// URL.')).toBeVisible();

		const submitButton = screen.getByRole('button', { name: 'Add Webhook' });
		await expect.element(submitButton).toBeDisabled();
	});

	it('enables submit once all fields are valid', async () => {
		const screen = render(AddWebhookModal, { open: true });

		await screen.getByLabelText('Webhook event type').click();
		await screen.getByRole('option', { name: 'PAYIN' }).click();
		await screen.getByLabelText(/Webhook URL/).fill('https://example.com/hooks/a');
		await screen.getByLabelText(/Secret Key/).fill('shh-secret');

		const submitButton = screen.getByRole('button', { name: 'Add Webhook' });
		await expect.element(submitButton).not.toBeDisabled();
	});
});
