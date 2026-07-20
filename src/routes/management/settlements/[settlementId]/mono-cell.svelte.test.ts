import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import MonoCell from './mono-cell.svelte';

describe('MonoCell', () => {
	it('renders the value in monospace styling', async () => {
		const screen = render(MonoCell, { value: 'TXN-MER01-20260708-0001' });

		await expect.element(screen.getByText('TXN-MER01-20260708-0001')).toBeVisible();
		const span = screen.container.querySelector('span');
		expect(span?.className).toContain('font-mono');
	});
});
