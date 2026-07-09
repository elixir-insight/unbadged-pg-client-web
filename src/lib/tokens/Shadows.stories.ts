import type { Meta, StoryObj } from '@storybook/sveltekit';
import Shadows from './Shadows.svelte';

const meta = {
	title: 'Design Tokens / Shadows',
	component: Shadows,
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component:
					'Three elevation levels for the payment UI — sm for dropdowns and tooltips, md for cards and panels, lg for modals and drawers.'
			}
		}
	}
} satisfies Meta<typeof Shadows>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
