<script lang="ts">
	import { Button, Modal } from '$lib/components/reusable';

	let {
		open = $bindable(false),
		title,
		description,
		missingNoteMessage = '',
		submitting = false,
		submitDisabled = false,
		onStay,
		onDiscard,
		onSubmit
	}: {
		open?: boolean;
		title: string;
		description: string;
		missingNoteMessage?: string;
		submitting?: boolean;
		submitDisabled?: boolean;
		onStay: () => void;
		onDiscard: () => void;
		onSubmit: () => void;
	} = $props();
</script>

<Modal bind:open {title} {description}>
	{#if missingNoteMessage}
		<p class="text-sm text-destructive" role="alert">{missingNoteMessage}</p>
	{/if}
	{#snippet footer()}
		<div class="flex w-full flex-wrap items-center justify-end gap-2">
			<Button variant="outline" disabled={submitting} onclick={onStay}>Stay</Button>
			<Button variant="destructive" disabled={submitting} onclick={onDiscard}>
				Discard and continue
			</Button>
			<Button disabled={submitDisabled || submitting} onclick={onSubmit}>
				{submitting ? 'Submitting…' : 'Submit and continue'}
			</Button>
		</div>
	{/snippet}
</Modal>
