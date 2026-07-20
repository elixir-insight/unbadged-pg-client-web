<script lang="ts">
	import { page } from '$app/state';
	import { ErrorPage } from '$lib/components/reusable';
	import { resolvePortalHome } from '$lib/stores/auth/portal';
	import type { LayoutData } from './$types';

	let { data }: { data: LayoutData } = $props();

	const status = $derived(page.status);
	const isNotFound = $derived(status === 404);
	const isUnauthorized = $derived(status === 401);

	const homeHref = $derived(
		data.session?.groups?.length ? resolvePortalHome(data.session.groups) : '/login'
	);

	const action = $derived(
		isUnauthorized && !data.session?.groups?.length
			? { label: 'Log in', href: '/login' }
			: { label: 'Go to home', href: homeHref }
	);

	const title = $derived(
		isNotFound ? 'Page not found' : isUnauthorized ? 'Unauthorized access' : 'Something went wrong'
	);

	const description = $derived(
		page.error?.message ??
			(isNotFound
				? "The page you are looking for doesn't exist or may have been moved. Check the URL or return to your dashboard."
				: isUnauthorized
					? 'You do not have permission to view this page. Sign in with an authorized account or return to your dashboard.'
					: 'An unexpected error occurred. Please try again or return to your dashboard.')
	);
</script>

<ErrorPage
	code={String(status)}
	{title}
	{description}
	actionLabel={action.label}
	actionHref={action.href}
/>
