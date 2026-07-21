import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import RevokeCredentialModal from './revoke-credential-modal.svelte';

describe('RevokeCredentialModal', () => {
	it('warns that revoking is permanent and breaks integrations', async () => {
		const screen = render(RevokeCredentialModal, { open: true, credentialId: 'cred-1' });

		await expect.element(screen.getByText(/permanently revoke this credential/i)).toBeVisible();
		await expect.element(screen.getByText(/cannot be undone/i)).toBeVisible();
	});

	it('closes without submitting when Cancel is clicked', async () => {
		const onrevoked = vi.fn();
		const screen = render(RevokeCredentialModal, {
			open: true,
			credentialId: 'cred-1',
			onrevoked
		});

		await screen.getByText('Cancel').click();

		expect(onrevoked).not.toHaveBeenCalled();
	});

	it('does not render when closed', async () => {
		const screen = render(RevokeCredentialModal, { open: false, credentialId: 'cred-1' });

		expect(screen.container.textContent + document.body.textContent).not.toContain(
			'permanently revoke'
		);
	});
});
