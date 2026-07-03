import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import BankDetails from './BankDetails.svelte';

function baseProps(overrides: Record<string, unknown> = {}) {
	return {
		isValid: false,
		onnext: vi.fn(),
		onprev: vi.fn(),
		...overrides
	};
}

async function fillBankForm(screen: ReturnType<typeof render>) {
	await screen.getByLabelText(/^Account number/i).fill('123456789');
	await screen.getByLabelText(/^Confirm account number/i).fill('123456789');
	await screen.getByLabelText(/^Bank/i).fill('HDFC Bank');
	await screen.getByLabelText(/^Account holder name/i).fill('Jane Doe');
	await screen.getByLabelText(/^IFSC Code/i).fill('HDFC0001234');
}

describe('BankDetails', () => {
	it('renders the add bank account form', async () => {
		const screen = render(BankDetails, baseProps());

		await expect.element(screen.getByText('Add Bank Account')).toBeVisible();
		await expect.element(screen.getByLabelText(/^Account number/i)).toBeVisible();
		await expect.element(screen.getByLabelText(/^Confirm account number/i)).toBeVisible();
		await expect.element(screen.getByLabelText(/^IFSC Code/i)).toBeVisible();
	});

	it('disables Continue until an account is saved', async () => {
		const screen = render(BankDetails, baseProps());

		await expect.element(screen.getByRole('button', { name: /Continue/i })).toBeDisabled();
	});

	it('disables Add Account when the form is incomplete', async () => {
		const screen = render(BankDetails, baseProps());

		await expect.element(screen.getByRole('button', { name: /Add Account/i })).toBeDisabled();
	});

	it('shows saved accounts and enables Continue after adding one', async () => {
		const screen = render(BankDetails, baseProps());

		await fillBankForm(screen);
		await screen.getByRole('button', { name: /Add Account/i }).click();

		await expect.element(screen.getByText('Saved Bank Accounts')).toBeVisible();
		await expect.element(screen.getByText('Jane Doe')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: /Continue/i })).toBeEnabled();
	});

	it('calls onprev when Previous is clicked', async () => {
		const onprev = vi.fn();
		const screen = render(BankDetails, baseProps({ onprev }));

		await screen.getByRole('button', { name: 'Previous' }).click();

		expect(onprev).toHaveBeenCalledOnce();
	});
});
