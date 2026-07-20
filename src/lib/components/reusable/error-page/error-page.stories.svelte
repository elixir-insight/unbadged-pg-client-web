<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ErrorPage from './error-page.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/ErrorPage',
		component: ErrorPage,
		tags: ['autodocs']
	});
</script>

<Story
	name="404 Not Found"
	exportName="NotFound404"
	args={{
		code: '404',
		title: 'Page not found',
		description:
			"The page you are looking for doesn't exist or may have been moved. Check the URL or return to your dashboard.",
		actionLabel: 'Go to home',
		actionHref: '/merchant'
	}}
/>

<Story
	name="401 Unauthorized"
	exportName="Unauthorized401"
	args={{
		code: '401',
		title: 'Unauthorized access',
		description:
			'You do not have permission to view this page. Sign in with an authorized account or return to your dashboard.',
		actionLabel: 'Log in',
		actionHref: '/login'
	}}
/>
