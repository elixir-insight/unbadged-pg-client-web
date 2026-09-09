<script lang="ts">
	import { EmptyState } from '$lib/components/reusable';
	import { ClipboardCheck } from '$lib/assets/icons';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="flex min-h-full items-center justify-center">
	<div class="w-full max-w-lg">
		<h1 class="sr-only">Self onboarding</h1>
		<EmptyState
			icon={ClipboardCheck}
			title="Complete your onboarding"
			description="Hi {data.displayName}. Your account is signed in but not approved yet. Finish organization setup so you can access the merchant portal."
		/>
	</div>
</div>
