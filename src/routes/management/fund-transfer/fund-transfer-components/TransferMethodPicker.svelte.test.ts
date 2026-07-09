import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TransferMethodPicker from './TransferMethodPicker.svelte';
import { transferMethods } from '../fund-transfer.svelte';

describe('TransferMethodPicker', () => {
	it('renders every transfer method label', async () => {
		const screen = render(TransferMethodPicker, {
			methods: transferMethods,
			value: null,
			onSelect: () => {}
		});

		for (const method of transferMethods) {
			await expect.element(screen.getByText(method.label, { exact: true })).toBeVisible();
		}
	});

	it('renders no method as checked when value is null', () => {
		const screen = render(TransferMethodPicker, {
			methods: transferMethods,
			value: null,
			onSelect: () => {}
		});

		const radios = screen.container.querySelectorAll('button[role="radio"]');
		expect(radios.length).toBe(transferMethods.length);
		for (const radio of radios) {
			expect(radio.getAttribute('aria-checked')).toBe('false');
		}
	});

	it('marks the matching method as checked when a value is provided', () => {
		const screen = render(TransferMethodPicker, {
			methods: transferMethods,
			value: transferMethods[0],
			onSelect: () => {}
		});

		const radios = screen.container.querySelectorAll('button[role="radio"]');
		expect(radios[0].getAttribute('aria-checked')).toBe('true');
		for (const radio of Array.from(radios).slice(1)) {
			expect(radio.getAttribute('aria-checked')).toBe('false');
		}
	});

	it('calls onSelect with the clicked method', async () => {
		const onSelect = vi.fn();
		const screen = render(TransferMethodPicker, {
			methods: transferMethods,
			value: null,
			onSelect
		});

		const radios = screen.container.querySelectorAll('button[role="radio"]');
		await radios[2].click();

		expect(onSelect).toHaveBeenCalledExactlyOnceWith(transferMethods[2]);
	});

	it('shows the selected method info text only when a value is selected', async () => {
		const withoutValue = render(TransferMethodPicker, {
			methods: transferMethods,
			value: null,
			onSelect: () => {}
		});
		expect(withoutValue.container.textContent).not.toContain(transferMethods[0].info);

		const withValue = render(TransferMethodPicker, {
			methods: transferMethods,
			value: transferMethods[0],
			onSelect: () => {}
		});
		await expect.element(withValue.getByText(transferMethods[0].info)).toBeVisible();
	});
});
