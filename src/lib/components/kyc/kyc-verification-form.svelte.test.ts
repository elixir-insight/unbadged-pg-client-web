import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import KycVerificationForm from './kyc-verification-form.svelte';
import type { KycTab, VerificationStatus } from './types';

function baseFormProps(
	overrides: {
		tab?: KycTab;
		status?: VerificationStatus;
		error?: string;
		onVerify?: () => void;
		onReset?: () => void;
	} = {}
) {
	return {
		tab: 'aadhaar' as const,
		status: 'idle' as const,
		onVerify: vi.fn(),
		onReset: vi.fn(),
		...overrides
	};
}

describe('KycVerificationForm', () => {
	it('renders the Aadhaar input when the Aadhaar tab is active', async () => {
		const screen = render(KycVerificationForm, baseFormProps());

		await expect.element(screen.getByLabelText('Aadhaar number')).toBeVisible();
	});

	it('renders the PAN input when the PAN tab is active', async () => {
		const screen = render(KycVerificationForm, baseFormProps({ tab: 'pan' }));

		await expect.element(screen.getByLabelText('PAN number')).toBeVisible();
	});

	it('shows a validation error when provided', async () => {
		const screen = render(
			KycVerificationForm,
			baseFormProps({ error: 'Aadhaar number must be exactly 12 digits.' })
		);

		await expect
			.element(screen.getByText('Aadhaar number must be exactly 12 digits.'))
			.toBeVisible();
	});

	it('disables the verify button while loading', async () => {
		const screen = render(KycVerificationForm, baseFormProps({ status: 'loading' }));

		await expect.element(screen.getByRole('button', { name: /Verifying/ })).toBeDisabled();
	});

	it('shows the reset action after a failed verification', async () => {
		const screen = render(KycVerificationForm, baseFormProps({ status: 'failed' }));

		await expect.element(screen.getByText('Start a new verification')).toBeVisible();
	});

	it('calls onVerify when the verify button is clicked', async () => {
		const onVerify = vi.fn();
		const screen = render(KycVerificationForm, baseFormProps({ onVerify }));

		await screen.getByRole('button', { name: /Verify Aadhaar/ }).click();

		expect(onVerify).toHaveBeenCalledOnce();
	});

	it('calls onReset when starting a new verification', async () => {
		const onReset = vi.fn();
		const screen = render(KycVerificationForm, baseFormProps({ status: 'success', onReset }));

		await screen.getByText('Start a new verification').click();

		expect(onReset).toHaveBeenCalledOnce();
	});
});
