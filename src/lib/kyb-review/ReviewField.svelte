<script lang="ts">
	import { Button, Dropdown, Textarea } from '$lib/components/reusable';
	import { cn } from '$lib/utils';
	import {
		VERIFICATION_STATUS_LABEL,
		type FieldReview,
		type ReviewField,
		type VerificationStatus
	} from './types';

	const statusOptions = [
		{ value: 'PENDING', label: VERIFICATION_STATUS_LABEL.PENDING },
		{ value: 'VERIFIED', label: VERIFICATION_STATUS_LABEL.VERIFIED },
		{ value: 'REJECTED', label: VERIFICATION_STATUS_LABEL.REJECTED }
	];

	const triggerClass: Record<VerificationStatus, string> = {
		VERIFIED: 'border-success/40 text-success',
		PENDING: 'border-warning/40 text-warning',
		REJECTED: 'border-destructive/40 text-destructive'
	};

	let {
		field,
		tracked,
		draft,
		changed,
		showSaved,
		invalid,
		disabled = false,
		onStatus,
		onRemarks,
		onUndo,
		onView
	}: {
		field: ReviewField;
		/** False when GET /verifications has no record for this fieldName: no review controls. */
		tracked: boolean;
		draft: FieldReview;
		changed: boolean;
		showSaved: boolean;
		invalid: boolean;
		disabled?: boolean;
		onStatus: (status: VerificationStatus) => void;
		onRemarks: (remarks: string) => void;
		onUndo: () => void;
		onView: () => void;
	} = $props();

	const domId = $derived(field.fieldName.replaceAll('.', '-'));
	const noteId = $derived(`${domId}-note`);
	const needsReviewNote = $derived(tracked && draft.status === 'REJECTED');

	function onStatusChange(value: string) {
		if (value === 'PENDING' || value === 'VERIFIED' || value === 'REJECTED') {
			onStatus(value);
		}
	}
</script>

<article
	class={cn(
		'flex h-full flex-col gap-3 rounded-xl border bg-card p-4',
		changed ? 'border-ring ring-2 ring-ring/30' : 'border-border/60'
	)}
>
	<div class="flex items-center justify-between gap-3">
		<h3 class="text-xs font-medium tracking-wide text-muted-foreground uppercase">{field.label}</h3>
		{#if changed}
			<Button variant="ghost" size="sm" {disabled} onclick={onUndo}>Undo</Button>
		{:else if showSaved}
			<p class="text-xs font-medium text-success">✓ Saved</p>
		{/if}
	</div>

	<div class="flex items-center gap-3">
		<div
			class="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2"
			title={field.value}
		>
			{#if field.prefix}
				<span class="shrink-0 text-sm text-muted-foreground">{field.prefix}</span>
			{/if}
			<span class="min-w-0 flex-1 truncate text-sm text-foreground">{field.value}</span>
			{#if field.href}
				<button
					type="button"
					class="shrink-0 text-sm font-medium text-primary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
					onclick={onView}
				>
					View
				</button>
			{/if}
		</div>
		{#if tracked}
			<!-- Dropdown does not accept an id, so this status control is labelled by a wrapping label. -->
			<label class="w-36 shrink-0">
				<span class="sr-only">{field.label} status</span>
				<Dropdown
					value={draft.status}
					options={statusOptions}
					ariaLabel={`${field.label} status`}
					{disabled}
					class={triggerClass[draft.status]}
					onValueChange={onStatusChange}
				/>
			</label>
		{:else}
			<p class="w-36 shrink-0 text-xs text-muted-foreground">Not tracked</p>
		{/if}
	</div>

	{#if needsReviewNote}
		<div
			class={cn(
				'rounded-md border border-destructive/30 bg-destructive/10 p-3',
				invalid && 'border-destructive'
			)}
		>
			<label for={noteId} class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
				Review note <span class="text-destructive">*</span>
			</label>
			<Textarea
				id={noteId}
				rows={2}
				value={draft.remarks}
				{disabled}
				aria-required="true"
				aria-invalid={invalid ? 'true' : undefined}
				placeholder={field.kind === 'document'
					? 'Add a review note for this document'
					: 'Add a review note for this field'}
				class="mt-2 min-h-0 border-transparent bg-transparent shadow-none"
				oninput={(event) => {
					onRemarks((event.currentTarget as HTMLTextAreaElement).value);
				}}
			/>
		</div>
	{/if}
</article>
