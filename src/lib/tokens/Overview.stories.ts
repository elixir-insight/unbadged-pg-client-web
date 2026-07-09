import type { Meta, StoryObj } from '@storybook/sveltekit';
import Overview from './Overview.svelte';

const meta = {
	title: 'Design Tokens / Overview',
	component: Overview,
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component:
					"A bird's-eye view of every design token category used across the payment gateway UI."
			}
		}
	}
} satisfies Meta<typeof Overview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
