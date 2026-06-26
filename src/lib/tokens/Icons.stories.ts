import type { Meta, StoryObj } from '@storybook/sveltekit';
import Icons from './Icons.svelte';

const meta = {
	title: 'Design Tokens / Icons',
	component: Icons,
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component:
					'All 103 icons available in `$lib/assets/icons` (from `@lucide/svelte`). Search by name, then click any icon to copy its import statement.'
			}
		}
	},
	argTypes: {
		size: {
			control: { type: 'range', min: 12, max: 48, step: 1 },
			description: 'Icon size in pixels'
		},
		strokeWidth: {
			control: { type: 'range', min: 1, max: 4, step: 0.5 },
			description: 'Stroke width'
		}
	},
	args: {
		size: 24,
		strokeWidth: 1.8
	}
} satisfies Meta<typeof Icons>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Large: Story = {
	args: { size: 36, strokeWidth: 1.5 }
};

export const ThinStroke: Story = {
	args: { size: 24, strokeWidth: 1 }
};
