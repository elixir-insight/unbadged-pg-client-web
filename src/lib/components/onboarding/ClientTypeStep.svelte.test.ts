import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ClientTypeStep from './ClientTypeStep.svelte';

const clientTypes = [
	{
		value: 'Merchant',
		title: 'Merchant',
		image: '/images/MerchantCategory.png'
	},
	{
		value: 'Partner',
		title: 'Partner',
		image: '/images/handShaking.png'
	},
	{
		value: 'Platform',
		title: 'Platform',
		image: '/images/handShaking.png'
	}
] as const;

async function renderStep(
	overrides: {
		selectedCategory?: 'Merchant' | 'Partner' | 'Platform' | null;
		onNext?: () => void;
	} = {}
) {
	return await render(ClientTypeStep, {
		selectedCategory: null,
		onNext: () => {},
		...overrides
	});
}

describe('ClientTypeStep', () => {
	it('renders the category selection heading', async () => {
		const screen = await renderStep();

		await expect.element(screen.getByText('What category would you like to choose?')).toBeVisible();
	});

	it('renders every category title', async () => {
		const screen = await renderStep();

		for (const type of clientTypes) {
			await expect.element(screen.getByText(type.title, { exact: true })).toBeVisible();
		}
	});

	it('renders category images from static assets', async () => {
		const screen = await renderStep();

		for (const type of clientTypes) {
			const image = screen.container.querySelector(`img[src="${type.image}"]`);
			expect(image).not.toBeNull();
		}
	});

	it('does not render a Continue button', async () => {
		const screen = await renderStep();

		expect(screen.container.textContent).not.toContain('Continue');
	});

	it('calls onNext when a category card is clicked', async () => {
		const onNext = vi.fn();
		const screen = await renderStep({ onNext });

		const partnerButton = screen.getByRole('button', { name: /Partner/ });
		await expect.element(partnerButton).toBeVisible();
		(partnerButton.element() as HTMLButtonElement).click();

		expect(onNext).toHaveBeenCalledOnce();
	});

	it('marks the selected category card as pressed', async () => {
		const screen = await renderStep({ selectedCategory: 'Merchant' });

		await expect
			.element(screen.getByRole('button', { name: /Merchant/ }))
			.toHaveAttribute('aria-pressed', 'true');
	});
});
