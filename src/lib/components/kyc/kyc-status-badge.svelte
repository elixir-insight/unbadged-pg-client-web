<script lang="ts">
	import { Chip } from '$lib/components/reusable';
	import { Check, X } from '$lib/assets/icons';
	import type { VerificationRecordStatus } from './types';

	let { status }: { status: VerificationRecordStatus } = $props();

	const isVerified = $derived(status === 'Verified');
</script>

<Chip
	variant={isVerified ? 'success' : 'error'}
	class="h-auto gap-0.5 px-1.5 py-0 text-[10px] leading-tight [&>svg]:size-2.5"
>
	{#if isVerified}
		<Check class="size-2.5" />
	{:else}
		<X class="size-2.5" />
	{/if}
	{status}
</Chip>
