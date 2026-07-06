import type { Meta, StoryObj } from '@storybook/sveltekit';
import Typography from './Typography.svelte';

const meta = {
	title: 'Design Tokens / Typography',
	component: Typography,
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component:
					'Type scale, weights, and line heights. Each size shows a live "Payment confirmed ₹1,200.00" sample and a usage hint for the payment UI.'
			}
		}
	}
} satisfies Meta<typeof Typography>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
