import type { Meta, StoryObj } from '@storybook/sveltekit';
import Radii from './Radii.svelte';

const meta = {
	title: 'Design Tokens / Border Radius',
	component: Radii,
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component:
					'Border radius tokens from sharp (none) to pill (full), each paired with a real-world use case in the payment UI.'
			}
		}
	}
} satisfies Meta<typeof Radii>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
