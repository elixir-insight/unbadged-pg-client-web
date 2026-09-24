import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import adapter from 'amplify-adapter';

// Vite 8 can wrap SSR dynamic imports with the browser-runner helper. That
// global only exists in the browser, so define a no-op fallback for Node.
const vitestGlobals = globalThis as typeof globalThis & {
	__vitest_browser_runner__?: { wrapDynamicImport: (fn: () => unknown) => unknown };
};
vitestGlobals.__vitest_browser_runner__ ??= {
	wrapDynamicImport: (fn) => fn()
};

const dirname =
	typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

const chromiumProvider = playwright({
	launchOptions: {
		args: ['--disable-dev-shm-usage']
	}
});

const lucideIconDeps = [
	'activity',
	'alert-circle',
	'alert-triangle',
	'align-justify',
	'arrow-down',
	'arrow-down-to-line',
	'arrow-left',
	'arrow-left-right',
	'arrow-right',
	'arrow-up',
	'arrow-up-down',
	'arrow-up-from-line',
	'badge-check',
	'banknote',
	'bar-chart-2',
	'bell',
	'bell-off',
	'blocks',
	'bot',
	'briefcase',
	'briefcase-business',
	'building-2',
	'calendar',
	'check',
	'check-circle-2',
	'chevron-down',
	'chevron-left',
	'chevron-right',
	'chevron-up',
	'chevrons-up-down',
	'circle',
	'circle-check',
	'circle-check-big',
	'circle-help',
	'circle-x',
	'clipboard-check',
	'clipboard-list',
	'clock',
	'cloud-upload',
	'coins',
	'copy',
	'credit-card',
	'dollar-sign',
	'download',
	'ellipsis-vertical',
	'external-link',
	'eye',
	'eye-off',
	'file-check-2',
	'file-clock',
	'file-text',
	'file-up',
	'fingerprint',
	'folder-open',
	'globe',
	'handshake',
	'hash',
	'home',
	'id-card',
	'image-plus',
	'info',
	'key',
	'landmark',
	'layers',
	'layout-dashboard',
	'layout-grid',
	'link',
	'loader-2',
	'loader-circle',
	'lock',
	'log-out',
	'mail',
	'map-pin',
	'menu',
	'message-square',
	'message-square-diff',
	'message-square-warning',
	'minus',
	'moon',
	'more-horizontal',
	'network',
	'octagon-x',
	'panel-left',
	'paperclip',
	'pencil',
	'percent',
	'phone',
	'plug',
	'plus',
	'receipt',
	'receipt-text',
	'refresh-cw',
	'rotate-ccw',
	'rows-3',
	'scan-line',
	'scan-search',
	'search',
	'send',
	'settings',
	'shield',
	'shield-check',
	'shield-x',
	'sliders-horizontal',
	'smartphone',
	'sparkles',
	'store',
	'sun',
	'table',
	'table-2',
	'thumbs-up',
	'trash-2',
	'trending-down',
	'trending-up',
	'triangle-alert',
	'undo-2',
	'upload',
	'upload-cloud',
	'user',
	'user-cog',
	'user-key',
	'user-plus',
	'users',
	'wallet',
	'wallet-cards',
	'x',
	'x-circle',
	'zap'
].map((name) => `@lucide/svelte/icons/${name}`);

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
	ssr: {
		external: ['pino', 'pino-pretty'],
		noExternal: ['bits-ui', 'svelte-toolbelt', 'svelte-sonner', 'vaul-svelte', 'runed']
	},
	optimizeDeps: {
		include: ['vitest-browser-svelte', ...lucideIconDeps]
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
					hookTimeout: 60000,
					// Browser RPC (birpc) is flaky when multiple files / workers share one Chromium.
					fileParallelism: false,
					maxWorkers: 1,
					setupFiles: ['vitest-browser-svelte'],
					retry: 2,
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
					// Cap forks on Windows — too many workers cause
					// "[vitest-pool]: Timeout waiting for worker to respond".
					maxWorkers: 4,
					fileParallelism: true,
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
					hookTimeout: 60000,
					fileParallelism: false,
					isolate: false,
					sequence: { groupOrder: 2 },
					maxWorkers: 1,
					retry: 2,
					browser: {
						enabled: true,
						headless: true,
						provider: chromiumProvider,
						instances: [
							{
								browser: 'chromium',
								headless: true
							}
						]
					}
				}
			}
		]
	}
});
