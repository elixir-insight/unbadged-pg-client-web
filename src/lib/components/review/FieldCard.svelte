<script lang="ts">
	import type { FieldData, ReviewerNote, NoteCategory } from '$lib/types/review';
	import SystemFlagCallout from './SystemFlagCallout.svelte';
	import ReviewerNoteDisplay from './ReviewerNoteDisplay.svelte';
	import { Button } from '$lib/components/reusable';
	import { MessageSquare } from '$lib/assets/icons';

	let {
		field,
		reviewerNote = undefined,
		onSave
	}: {
		field: FieldData;
		reviewerNote?: ReviewerNote;
		onSave: (note: string, category: NoteCategory) => void;
	} = $props();

	let isEditing = $state(false);
	let draftNote = $state('');
	let draftCategory = $state<NoteCategory>('observation');

	function startEdit() {
		draftNote = reviewerNote?.note ?? '';
		draftCategory = reviewerNote?.category ?? 'observation';
		isEditing = true;
	}

	function handleSave() {
		const trimmed = draftNote.trim();
		if (trimmed) onSave(trimmed, draftCategory);
		isEditing = false;
	}

	function cancel() {
		isEditing = false;
		draftNote = '';
	}

	const categories: {
		key: NoteCategory;
		label: string;
		inactiveClass: string;
		activeClass: string;
	}[] = [
		{
			key: 'observation',
			label: 'Observation',
			inactiveClass: 'border-border text-muted-foreground hover:bg-muted',
			activeClass:
				'border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
		},
		{
			key: 'concern',
			label: 'Concern',
			inactiveClass: 'border-border text-muted-foreground hover:bg-muted',
			activeClass:
				'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
		},
		{
			key: 'change_required',
			label: 'Change Required',
			inactiveClass: 'border-border text-muted-foreground hover:bg-muted',
			activeClass:
				'border-red-400 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-950/40 dark:text-red-400'
		}
	];
</script>

<div
	id={field.key}
	class="rounded-xl border border-border/40 bg-background/80 shadow-sm backdrop-blur-sm transition-all hover:border-border/60 hover:shadow-md"
>
	<!-- Field content -->
	<div class="p-4">
		<!-- Header row: dot + label/value + review icon -->
		<div class="flex items-start justify-between gap-3">
			<div class="flex min-w-0 flex-1 items-start gap-2.5">
				<!-- Status dot -->
				<span
					class={[
						'mt-0.75 size-2 shrink-0 rounded-full',
						field.systemFlag?.severity === 'error'
							? 'bg-red-500'
							: field.systemFlag
								? 'bg-amber-500'
								: 'bg-amber-400'
					].join(' ')}
				></span>

				<div class="min-w-0 flex-1">
					<p
						class="text-[10px] leading-none font-semibold tracking-widest text-muted-foreground uppercase"
					>
						{field.label}
					</p>
					<p class="mt-1.5 text-sm leading-snug font-medium wrap-break-word text-foreground">
						{field.value}
					</p>
				</div>
			</div>

			<!-- Review icon button -->
			<button
				onclick={startEdit}
				title={reviewerNote ? 'Edit review' : 'Add review'}
				class={[
					'mt-0.5 py-1 px-2 flex gap-2 shrink-0 items-center justify-center rounded-lg border transition-all text-xs',
					reviewerNote
						? 'border-primary/40 bg-primary/10 text-primary shadow-sm'
						: 'border-border text-muted-foreground hover:border-muted-foreground/40 hover:bg-muted hover:text-foreground'
				].join(' ')}
			>
				<MessageSquare class="size-3.5" /> Add comments
			</button>
		</div>

		<!-- System flag callout -->
		{#if field.systemFlag}
			<SystemFlagCallout flag={field.systemFlag} />
		{/if}

		<!-- Existing reviewer note -->
		{#if reviewerNote && !isEditing}
			<ReviewerNoteDisplay note={reviewerNote} onEdit={startEdit} />
		{/if}
	</div>

	<!-- Note editor panel (separated by border) -->
	{#if isEditing}
		<div class="space-y-2.5 border-t border-border/50 px-4 pt-3 pb-4">
			<!-- Category selector -->
			<div class="flex flex-wrap gap-1.5">
				{#each categories as cat (cat.key)}
					<button
						onclick={() => (draftCategory = cat.key)}
						class={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-all ${draftCategory === cat.key ? cat.activeClass : cat.inactiveClass}`}
					>
						{cat.label}
					</button>
				{/each}
			</div>
			<textarea
				bind:value={draftNote}
				placeholder="Enter review comment"
				rows="3"
				class="w-full resize-none rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-[12px] placeholder:text-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none dark:border-primary/30 dark:bg-primary/10"
			></textarea>
			<div class="flex justify-end gap-1.5">
				<Button variant="ghost" size="xs" onclick={cancel}>Cancel</Button>
				<Button class="gradient-primary text-primary-foreground" size="xs" onclick={handleSave}>
					Save review
				</Button>
			</div>
		</div>
	{/if}
</div>
