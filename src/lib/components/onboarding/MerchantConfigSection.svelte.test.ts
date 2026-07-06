import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MerchantConfigSection from './MerchantConfigSection.svelte';
import {
	availableAffiliates,
	availableServiceTypes
} from '../../../routes/management/onboarding/create-organization/constants';

function baseProps(overrides: Record<string, unknown> = {}) {
	return {
		selectedServiceTypes: [] as string[],
		affiliateId: '',
		errors: {} as Record<string, string>,
		availableServiceTypes,
		availableAffiliates,
		onToggleService: vi.fn(),
		onAffiliateChange: vi.fn(),
		...overrides
	};
}

describe('MerchantConfigSection', () => {
	it('renders every available service type', async () => {
		const screen = render(MerchantConfigSection, baseProps());

		for (const svc of availableServiceTypes) {
			await expect.element(screen.getByText(svc.label, { exact: true })).toBeVisible();
		}
	});

	it('calls onToggleService when a service switch is toggled', async () => {
		const onToggleService = vi.fn();
		const screen = render(MerchantConfigSection, baseProps({ onToggleService }));

		await screen.getByRole('switch').first().click();

		expect(onToggleService).toHaveBeenCalledWith('Pay-Ins', true);
	});

	it('renders the affiliate id dropdown for merchants', async () => {
		const screen = render(MerchantConfigSection, baseProps());

		await expect.element(screen.getByText(/^Affiliate Id\b/)).toBeVisible();
		await expect.element(screen.getByText('Select Affiliate Id')).toBeVisible();
	});

	it('does not render bank pipeline controls', async () => {
		const screen = render(
			MerchantConfigSection,
			baseProps({ selectedServiceTypes: ['Pay-Ins', 'Payouts'] })
		);

		await expect.element(screen.getByText('Pay-Ins', { exact: true })).toBeVisible();
		await expect.element(screen.getByText('Payouts', { exact: true })).toBeVisible();
		expect(screen.container.textContent).not.toContain('Bank Pipeline');
	});

	it('shows the service type validation error when present', async () => {
		const screen = render(
			MerchantConfigSection,
			baseProps({ errors: { serviceTypes: 'Select at least one service type' } })
		);

		await expect.element(screen.getByText('Select at least one service type')).toBeVisible();
	});
});
