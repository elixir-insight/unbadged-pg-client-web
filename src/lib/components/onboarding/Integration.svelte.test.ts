import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Integration from './Integration.svelte';

function baseProps(overrides: Record<string, unknown> = {}) {
	return {
		isValid: false,
		onprev: vi.fn(),
		onsubmit: vi.fn(),
		...overrides
	};
}

describe('Integration', () => {
	it('renders integration fields', async () => {
		const screen = render(Integration, baseProps());

		await expect.element(screen.getByText('Application Integration')).toBeVisible();
		await expect.element(screen.getByText('Webhook & Callbacks')).toBeVisible();
		await expect.element(screen.getByLabelText(/^Callback URL/i)).toBeVisible();
		await expect.element(screen.getByLabelText(/^IP Address/i)).toBeVisible();
	});

	it('disables Save & Continue when callback URL is empty', async () => {
		const screen = render(Integration, baseProps());

		await expect.element(screen.getByRole('button', { name: /Save & Continue/i })).toBeDisabled();
	});

	it('calls onsubmit when a valid callback URL is submitted', async () => {
		const onsubmit = vi.fn();
		const screen = render(Integration, baseProps({ onsubmit }));

		await screen.getByLabelText(/^Callback URL/i).fill('https://example.com/callback');
		await screen.getByRole('button', { name: /Save & Continue/i }).click();

		expect(onsubmit).toHaveBeenCalledOnce();
	});

	it('calls onprev when Previous is clicked', async () => {
		const onprev = vi.fn();
		const screen = render(Integration, baseProps({ onprev }));

		await screen.getByRole('button', { name: 'Previous' }).click();

		expect(onprev).toHaveBeenCalledOnce();
	});
});
