<script lang="ts">
	import { Modal, Button } from '$lib/components/reusable';
	import { cn } from '$lib/utils';

	interface Props {
		open?: boolean;
		beneficiaryName: string;
		onconfirm?: (remarks: string) => void | Promise<void>;
	}

	let { open = $bindable(false), beneficiaryName, onconfirm }: Props = $props();

	let remarks = $state('');
	let isSubmitting = $state(false);
	let remarksError = $state('');

	$effect(() => {
		if (open) {
			remarks = '';
			remarksError = '';
			isSubmitting = false;
		}
	});

	function validateRemarks(val: string): string {
		if (!val.trim()) return 'Remarks are required';
		if (val.trim().length < 5) return 'Remarks must be at least 5 characters';
		return '';
	}

	async function handleSubmit() {
		remarksError = validateRemarks(remarks);
		if (remarksError) return;

		isSubmitting = true;
		await onconfirm?.(remarks);
		isSubmitting = false;
		open = false;
	}
</script>

<Modal bind:open title="Retry Payout" description="Retry payout to {beneficiaryName}">
	<div class="flex flex-col gap-5">
		<div class="flex flex-col gap-1.5">
			<label for="retry-remarks" class="text-sm font-medium text-foreground">
				Remarks <span class="text-destructive">*</span>
			</label>
			<textarea
				id="retry-remarks"
				bind:value={remarks}
				oninput={() => (remarksError = '')}
				rows={3}
				placeholder="Reason for retry (e.g. corrected account details…)"
				class={cn(
					'w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
					remarksError && 'border-destructive focus-visible:ring-destructive/20'
				)}></textarea>
			{#if remarksError}
				<p class="text-xs text-destructive">{remarksError}</p>
			{/if}
		</div>
	</div>

	{#snippet footer()}
		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<Button variant="outline" class="w-full sm:w-auto" onclick={() => (open = false)}>
				Cancel
			</Button>
			<Button onclick={handleSubmit} disabled={isSubmitting} class="w-full sm:w-auto">
				{#if isSubmitting}
					<span
						class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
					></span>
					Processing…
				{:else}
					Confirm retry
				{/if}
			</Button>
		</div>
	{/snippet}
</Modal>
