import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { render } from 'vitest-browser-svelte';
import SectionWrapper from './SectionWrapper.svelte';

const children = createRawSnippet(() => ({
	render: () => '<p data-testid="section-content">Section body</p>'
}));

const actions = createRawSnippet(() => ({
	render: () => '<button type="button">Action</button>'
}));

function renderWrapper(
	overrides: {
		title?: string;
		description?: string;
		actions?: ReturnType<typeof createRawSnippet>;
	} = {}
) {
	return render(SectionWrapper, {
		title: 'Test Section',
		description: 'Test description',
		children,
		...overrides
	});
}

describe('SectionWrapper', () => {
	it('renders title and description', async () => {
		const screen = renderWrapper();

		await expect.element(screen.getByText('Test Section')).toBeVisible();
		await expect.element(screen.getByText('Test description')).toBeVisible();
	});

	it('renders children content', async () => {
		const screen = renderWrapper();

		await expect.element(screen.getByTestId('section-content')).toBeVisible();
	});

	it('renders actions snippet when provided', async () => {
		const screen = renderWrapper({ actions });

		await expect.element(screen.getByRole('button', { name: 'Action' })).toBeVisible();
	});

	it('omits the header when title and icon are absent', async () => {
		const screen = render(SectionWrapper, { title: '', children });

		expect(screen.container.textContent).not.toContain('Test Section');
		await expect.element(screen.getByTestId('section-content')).toBeVisible();
	});
});
