import type { Meta, StoryObj } from '@storybook/sveltekit';
import Spacing from './Spacing.svelte';

const meta = {
	title: 'Design Tokens / Spacing',
	component: Spacing,
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component:
					'12 spacing values (4px–96px). Bar widths are proportional so you can visually compare scale at a glance.'
			}
		}
	}
} satisfies Meta<typeof Spacing>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
