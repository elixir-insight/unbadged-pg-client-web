import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MerchantProfileStep from './merchant-profile-step.svelte';
import {
	availableAffiliates,
	availableServiceTypes,
	businessTypes
} from '../../../routes/management/onboarding/create-organization/constants';

function baseProps(overrides: Record<string, unknown> = {}) {
	return {
		selectedCategory: 'MERCHANT' as const,
		orgName: '',
		orgPhone: '',
		orgEmail: '',
		orgBusinessType: '',
		selectedServiceTypes: [] as string[],
		affiliateId: '',
		errors: {} as Record<string, string>,
		businessTypes,
		availableServiceTypes,
		availableAffiliates,
		onFieldInput: vi.fn(),
		onToggleService: vi.fn(),
		onAffiliateChange: vi.fn(),
		onPrev: vi.fn(),
		onNext: vi.fn(),
		...overrides
	};
}

describe('MerchantProfileStep', () => {
	it('renders organization profile fields', async () => {
		const screen = render(MerchantProfileStep, baseProps());

		await expect.element(screen.getByLabelText(/Organization Name/i)).toBeVisible();
		await expect.element(screen.getByLabelText(/Email Address/i)).toBeVisible();
		await expect.element(screen.getByLabelText(/Mobile Number/i)).toBeVisible();
		await expect.element(screen.getByText(/^Business Type\b/)).toBeVisible();
	});

	it('renders merchant config section for merchants', async () => {
		const screen = render(MerchantProfileStep, baseProps());

		await expect.element(screen.getByText(/^Service Types\b/)).toBeVisible();
		await expect.element(screen.getByText(/^Affiliate Id\b/)).toBeVisible();
	});

	it('does not render merchant config section for partners', async () => {
		const screen = render(
			MerchantProfileStep,
			baseProps({ selectedCategory: 'PARTNER', selectedServiceTypes: [] })
		);

		expect(screen.container.textContent).not.toContain('Service Types');
		expect(screen.container.textContent).not.toContain('Affiliate Id');
	});

	it('shows validation errors when present', async () => {
		const screen = render(
			MerchantProfileStep,
			baseProps({ errors: { orgName: 'Organization name is required' } })
		);

		await expect.element(screen.getByText('Organization name is required')).toBeVisible();
	});

	it('calls navigation handlers from action buttons', async () => {
		const onPrev = vi.fn();
		const onNext = vi.fn();
		const screen = render(MerchantProfileStep, baseProps({ onPrev, onNext }));

		await screen.getByRole('button', { name: 'Back' }).click();
		await screen.getByRole('button', { name: 'Create Merchant' }).click();

		expect(onPrev).toHaveBeenCalledOnce();
		expect(onNext).toHaveBeenCalledOnce();
	});
});
