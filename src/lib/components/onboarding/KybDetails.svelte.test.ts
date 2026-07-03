import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import KybDetails from './KybDetails.svelte';

function baseProps(overrides: Record<string, unknown> = {}) {
	return {
		directors: [{ id: 1, name: '', aadhaar: '', pan: '', email: '', phone: '' }],
		nextDirectorId: 2,
		directorDocFiles: { 1: { aadhaar: null, pan: null } },
		businessType: 'Partnership',
		isValid: false,
		onnext: vi.fn(),
		...overrides
	};
}

describe('KybDetails', () => {
	it('renders KYB section headings', async () => {
		const screen = render(KybDetails, baseProps());

		await expect.element(screen.getByText('Know Your Business')).toBeVisible();
		await expect.element(screen.getByText('Address & Location')).toBeVisible();
		await expect.element(screen.getByText('Business Registration')).toBeVisible();
		await expect.element(screen.getByText('Contact & Branding')).toBeVisible();
		await expect.element(screen.getByText('Directors & Signatories')).toBeVisible();
	});

	it('shows required fields missing indicators for incomplete sections', async () => {
		const screen = render(KybDetails, baseProps());

		const indicators = screen.container.querySelectorAll('span');
		const missingLabels = [...indicators].filter((el) =>
			el.textContent?.includes('Required fields missing')
		);

		expect(missingLabels.length).toBeGreaterThan(0);
	});

	it('disables Save & continue until the form is complete', async () => {
		const screen = render(KybDetails, baseProps());

		await expect.element(screen.getByRole('button', { name: /Save & continue/i })).toBeDisabled();
	});

	it('expands the contact section when its header is clicked', async () => {
		const screen = render(KybDetails, baseProps());

		await screen.getByRole('button', { name: /Contact & Branding/i }).click();

		await expect.element(screen.getByLabelText(/^Company Phone/i)).toBeVisible();
		await expect.element(screen.getByLabelText(/^Website URL/i)).toBeVisible();
	});

	it('adds another director when Add Director is clicked', async () => {
		const screen = render(KybDetails, baseProps());

		await screen.getByRole('button', { name: /Directors & Signatories/i }).click();
		await screen.getByRole('button', { name: /Add Director/i }).click();

		await expect.element(screen.getByText('2. Director')).toBeVisible();
	});

	it('shows CIN and TAN as required for private limited businesses', async () => {
		const screen = render(KybDetails, baseProps({ businessType: 'PRIVATE_LIMITED' }));

		await screen.getByRole('button', { name: /Business Registration/i }).click();

		const cinLabel = screen.container.querySelector('label[for="kyb-cin"]');
		const tanLabel = screen.container.querySelector('label[for="kyb-tan"]');

		expect(cinLabel?.textContent).toContain('*');
		expect(tanLabel?.textContent).toContain('*');
	});
});
