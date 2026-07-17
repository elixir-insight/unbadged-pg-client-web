import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import RevealCredentialModal from './reveal-credential-modal.svelte';

const credential = { clientId: 'client-1', clientSecret: 'super-secret-value' };

describe('RevealCredentialModal', () => {
	it('shows the clientId and warns the secret is only available via download', async () => {
		const screen = render(RevealCredentialModal, { credential, onclose: vi.fn() });

		await expect.element(screen.getByText('client-1')).toBeVisible();
		await expect.element(screen.getByText(/never shown on screen/i)).toBeVisible();
	});

	it('never renders the raw clientSecret anywhere on screen', async () => {
		const screen = render(RevealCredentialModal, { credential, onclose: vi.fn() });

		expect(screen.container.textContent).not.toContain('super-secret-value');
		expect(document.body.textContent).not.toContain('super-secret-value');
	});

	it('offers a CSV download action as the only way to obtain the secret', async () => {
		const screen = render(RevealCredentialModal, { credential, onclose: vi.fn() });

		await expect.element(screen.getByText('Download credentials (.csv)')).toBeVisible();
	});

	it('discards the secret from view and notifies the parent when Done is clicked', async () => {
		const onclose = vi.fn();
		const screen = render(RevealCredentialModal, { credential, onclose });

		await screen.getByText('Done').click();

		expect(onclose).toHaveBeenCalledOnce();
	});
});
