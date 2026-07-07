import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import KycFailedState from './kyc-failed-state.svelte';

describe('KycFailedState', () => {
	it('renders the failure message', async () => {
		const screen = render(KycFailedState, { onRetry: vi.fn() });

		await expect.element(screen.getByText('Verification failed')).toBeVisible();
	});

	it('calls onRetry when Try again is clicked', async () => {
		const onRetry = vi.fn();
		const screen = render(KycFailedState, { onRetry });

		await screen.getByRole('button', { name: 'Try again' }).click();

		expect(onRetry).toHaveBeenCalledOnce();
	});
});
