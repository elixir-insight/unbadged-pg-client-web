import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Documents from './documents.svelte';

const directors = [
	{
		id: 1,
		name: 'Jane Doe',
		aadhaar: '123456789012',
		pan: 'ABCDE1234F',
		email: 'jane@example.com',
		phone: '9876543210'
	}
];

function baseProps(overrides: Record<string, unknown> = {}) {
	return {
		directors,
		directorDocFiles: { 1: { aadhaar: null, pan: null } },
		businessType: 'Partnership',
		isValid: false,
		onnext: vi.fn(),
		onprev: vi.fn(),
		...overrides
	};
}

describe('Documents', () => {
	it('renders document verification sections', async () => {
		const screen = render(Documents, baseProps());

		await expect.element(screen.getByText('Document Verification')).toBeVisible();
		await expect.element(screen.getByText('Business Documents')).toBeVisible();
		await expect.element(screen.getByText('Additional Documents')).toBeVisible();
		await expect.element(screen.getByText('Director Documents')).toBeVisible();
	});

	it('renders director upload fields for each director', async () => {
		const screen = render(Documents, baseProps());

		await expect.element(screen.getByText('Jane Doe')).toBeVisible();
		expect(screen.container.textContent).toContain('Upload Aadhaar');
		expect(screen.container.textContent).toContain('Upload PAN');
	});

	it('shows private limited document fields when business type is private limited', async () => {
		const screen = render(Documents, baseProps({ businessType: 'Private Limited' }));

		await expect.element(screen.getByText('Business PAN card')).toBeVisible();
		await expect
			.element(screen.getByText('Memorandum of Association Certificate (MOA)'))
			.toBeVisible();
	});

	it('hides private limited document fields for other business types', async () => {
		const screen = render(Documents, baseProps({ businessType: 'Partnership' }));

		expect(screen.container.textContent).not.toContain('Business PAN card');
		expect(screen.container.textContent).not.toContain(
			'Memorandum of Association Certificate (MOA)'
		);
	});

	it('disables Save & Continue until required documents are uploaded', async () => {
		const screen = render(Documents, baseProps());

		await expect.element(screen.getByRole('button', { name: /Save & Continue/i })).toBeDisabled();
	});

	it('calls onprev when Previous is clicked', async () => {
		const onprev = vi.fn();
		const screen = render(Documents, baseProps({ onprev }));

		await screen.getByRole('button', { name: 'Previous' }).click();

		expect(onprev).toHaveBeenCalledOnce();
	});
});
