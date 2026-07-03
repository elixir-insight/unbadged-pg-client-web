import type { Meta, StoryObj } from '@storybook/sveltekit';
import Colors from './Colors.svelte';

const meta = {
	title: 'Design Tokens / Colors',
	component: Colors,
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component:
					'Color tokens for the payment gateway. Click any swatch to copy its hex value. Semantic groups (success, danger, warning) include UX guidance.'
			}
		}
	}
} satisfies Meta<typeof Colors>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
