import type { Preview } from '@storybook/sveltekit';
import '../src/routes/layout.css';

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i
			}
		},

		a11y: {
			test: 'todo'
		},

		options: {
			storySort: {
				order: [
					'Design Tokens',
					[
						'Overview',
						'Colors',
						'Typography',
						'Spacing',
						'Border Radius',
						'Shadows',
						'Icons'
					],
					'Payment',
					['Icon Gallery', 'Icons', '*']
				]
			}
		}
	}
};

export default preview;