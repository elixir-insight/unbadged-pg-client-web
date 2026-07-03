<script lang="ts">
	import type { SectionStatus } from '$lib/types/review';
	import { Button } from '$lib/components/reusable';
	import { CheckIcon, XIcon } from '$lib/assets/icons';
	import { cn } from '$lib/utils';

	let {
		status,
		onApprove,
		onReject
	}: {
		status: SectionStatus;
		onApprove: () => void;
		onReject: () => void;
	} = $props();
</script>

<div
	class="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
>
	<p class="text-sm text-muted-foreground">
		Decide on this section once you've added any review notes.
	</p>
	<div class="flex shrink-0 items-center gap-2">
		<Button
			variant="outline"
			size="sm"
			onclick={onReject}
			class={cn(
				status === 'CHANGES_REQUESTED'
					? 'border-amber-400 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
					: ''
			)}
		>
			<XIcon class="size-4" />
			{status === 'CHANGES_REQUESTED' ? 'Changes Requested' : 'Request Changes'}
		</Button>
		<Button
			size="sm"
			onclick={onApprove}
			class={cn(
				status === 'APPROVED'
					? 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600'
					: 'gradient-primary text-primary-foreground'
			)}
		>
			<CheckIcon class="size-4" />
			{status === 'APPROVED' ? 'Approved' : 'Approve section'}
		</Button>
	</div>
</div>
