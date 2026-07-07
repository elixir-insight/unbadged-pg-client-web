import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MerchantConfigSection from './MerchantConfigSection.svelte';
import {
	availableServiceTypes,
	availableBankPipelines,
	affiliatesByPipeline
} from '../../../routes/management/onboarding/create-organization/constants';

function baseProps(overrides: Record<string, unknown> = {}) {
	return {
		selectedServiceTypes: [] as string[],
		servicePipelines: {} as Record<string, string>,
		affiliateId: '',
		errors: {} as Record<string, string>,
		availableServiceTypes,
		availableBankPipelines,
		affiliatesByPipeline,
		onToggleService: vi.fn(),
		onPipelineChange: vi.fn(),
		...overrides
	};
}

function countPlaceholderText(container: HTMLElement, text: string) {
	const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
	let count = 0;

	while (walker.nextNode()) {
		if (walker.currentNode.textContent?.trim() === text) count += 1;
	}

	return count;
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

	it('shows a bank pipeline dropdown when a service type is enabled', async () => {
		const screen = render(MerchantConfigSection, baseProps({ selectedServiceTypes: ['Pay-Ins'] }));

		await expect.element(screen.getByText('Select Bank Pipeline')).toBeVisible();
	});

	it('shows separate bank pipeline dropdowns for multiple enabled services', async () => {
		const screen = render(
			MerchantConfigSection,
			baseProps({ selectedServiceTypes: ['Pay-Ins', 'Payouts'] })
		);

		expect(countPlaceholderText(screen.container, 'Select Bank Pipeline')).toBe(2);
	});

	it('does not show bank pipeline dropdowns when no service is selected', async () => {
		const screen = render(MerchantConfigSection, baseProps());

		expect(countPlaceholderText(screen.container, 'Select Bank Pipeline')).toBe(0);
	});

	it('shows the service type validation error when present', async () => {
		const screen = render(
			MerchantConfigSection,
			baseProps({ errors: { serviceTypes: 'Select at least one service type' } })
		);

		await expect.element(screen.getByText('Select at least one service type')).toBeVisible();
	});

	it('shows per-service bank pipeline validation errors when present', async () => {
		const screen = render(
			MerchantConfigSection,
			baseProps({
				selectedServiceTypes: ['Pay-Ins'],
				errors: { 'bankPipeline_Pay-Ins': 'Select a bank pipeline' }
			})
		);

		await expect.element(screen.getByText('Select a bank pipeline')).toBeVisible();
	});

	it('disables the affiliate dropdown until a bank pipeline is selected', async () => {
		const screen = render(
			MerchantConfigSection,
			baseProps({ selectedServiceTypes: ['Pay-Ins'], servicePipelines: {} })
		);

		await expect
			.element(screen.getByText('Select a Collections Bank Pipeline to continue'))
			.toBeVisible();
	});

	it('enables the affiliate dropdown once a bank pipeline is selected', async () => {
		const screen = render(
			MerchantConfigSection,
			baseProps({
				selectedServiceTypes: ['Pay-Ins'],
				servicePipelines: { 'Pay-Ins': 'HDFC Bank' }
			})
		);

		await expect.element(screen.getByText('Select Affiliate')).toBeVisible();
	});
});
