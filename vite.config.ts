import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import adapter from 'amplify-adapter';
const dirname =
	typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

const chromiumProvider = playwright({
	launchOptions: {
		args: ['--disable-dev-shm-usage']
	}
});

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
	ssr: {
		external: ['pino', 'pino-pretty'],
		noExternal: ['bits-ui', 'svelte-toolbelt', 'svelte-sonner', 'vaul-svelte', 'runed']
	},
	optimizeDeps: {
		include: ['@lucide/svelte/icons/undo']
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter()
		})
	],
	test: {
		expect: {
			requireAssertions: true
		},
		// Vitest reads connectTimeout from the root config, not per-project.
		browser: {
			connectTimeout: 120000
		},
		projects: [
			{
				extends: true,
				test: {
					name: 'client',
					testTimeout: 60000,
					sequence: { groupOrder: 1 },
					browser: {
						enabled: true,
						headless: true,
						provider: chromiumProvider,
						instances: [
							{
								browser: 'chromium'
							}
						]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},
			{
				extends: true,
				test: {
					name: 'server',
					environment: 'node',
					sequence: { groupOrder: 0 },
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			},
			{
				extends: true,
				plugins: [
					// The plugin will run tests for the stories defined in your Storybook config
					// See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
					storybookTest({
						configDir: path.join(dirname, '.storybook')
					})
				],
				test: {
					name: 'storybook',
					testTimeout: 60000,
					fileParallelism: false,
					isolate: false,
					sequence: { groupOrder: 2 },
					browser: {
						enabled: true,
						headless: true,
						provider: chromiumProvider,
						instances: [
							{
								browser: 'chromium'
							}
						]
					}
				}
			}
		]
	}
});
