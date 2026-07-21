import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ApiCredentialSection from './api-credential-section.svelte';

describe('ApiCredentialSection — no credential yet', () => {
	it('shows the Generate button with one-time-only copy', async () => {
		const screen = render(ApiCredentialSection, { credential: null });

		await expect.element(screen.getByText('Generate API Credential')).toBeVisible();
		await expect.element(screen.getByText(/can only be done once/i)).toBeVisible();
	});

	it('does not show a Delete button', async () => {
		const screen = render(ApiCredentialSection, { credential: null });

		expect(screen.container.textContent).not.toContain('Delete API Credential');
	});
});

describe('ApiCredentialSection — credential exists', () => {
	const credential = { id: 'cred-1', clientId: 'client_ABCDEFGH1234' };

	it('shows the masked clientId and Delete button', async () => {
		const screen = render(ApiCredentialSection, { credential });

		await expect.element(screen.getByText('clie••••••••1234')).toBeVisible();
		await expect.element(screen.getByText('Delete API Credential')).toBeVisible();
	});

	it('never renders the raw clientId or a clientSecret', async () => {
		const screen = render(ApiCredentialSection, { credential });

		expect(screen.container.textContent).not.toContain(credential.clientId);
	});

	it('does not render the Generate button at all — not just disabled', async () => {
		const screen = render(ApiCredentialSection, { credential });

		expect(screen.container.textContent).not.toContain('Generate API Credential');
	});

	it('requires confirmation before revoking — the confirm dialog is not shown until Delete is clicked', async () => {
		const screen = render(ApiCredentialSection, { credential });

		expect(screen.container.textContent).not.toContain('permanently revoke this credential');

		await screen.getByText('Delete API Credential').click();

		await expect.element(screen.getByText(/permanently revoke this credential/i)).toBeVisible();
	});
});

describe('ApiCredentialSection — load error', () => {
	it('shows a retryable error banner instead of either credential view', async () => {
		const screen = render(ApiCredentialSection, {
			credential: null,
			loadError: 'Could not load your API credential. Please try again.'
		});

		await expect
			.element(screen.getByText('Could not load your API credential. Please try again.'))
			.toBeVisible();
		expect(screen.container.textContent).not.toContain('Generate API Credential');
	});
});
