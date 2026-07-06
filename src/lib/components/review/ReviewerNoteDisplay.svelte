<script lang="ts">
	import type { ReviewerNote, NoteCategory } from '$lib/types/review';
	import { PencilIcon } from '$lib/assets/icons';

	let { note, onEdit }: { note: ReviewerNote; onEdit: () => void } = $props();

	type CategoryStyle = { container: string; label: string; avatar: string; meta: string };

	const categoryStyles: Record<NoteCategory | 'default', CategoryStyle> = {
		observation: {
			container: 'border-blue-200 bg-blue-50/70 dark:border-blue-800/40 dark:bg-blue-950/20',
			label: 'text-blue-600 dark:text-blue-400',
			avatar: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
			meta: 'text-blue-500/70 dark:text-blue-400/60'
		},
		concern: {
			container: 'border-amber-200 bg-amber-50/70 dark:border-amber-800/40 dark:bg-amber-950/20',
			label: 'text-amber-600 dark:text-amber-400',
			avatar: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
			meta: 'text-amber-500/70 dark:text-amber-400/60'
		},
		change_required: {
			container: 'border-red-200 bg-red-50/70 dark:border-red-800/40 dark:bg-red-950/20',
			label: 'text-red-600 dark:text-red-400',
			avatar: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
			meta: 'text-red-500/70 dark:text-red-400/60'
		},
		default: {
			container: 'border-primary/20 bg-primary/5 dark:border-primary/25 dark:bg-primary/10',
			label: 'text-primary',
			avatar: 'bg-primary/15 text-primary dark:bg-primary/25',
			meta: 'text-primary/60'
		}
	};

	const categoryLabels: Record<NoteCategory, string> = {
		observation: 'Observation',
		concern: 'Concern',
		change_required: 'Change Required'
	};

	const styles = $derived(categoryStyles[note.category ?? 'default']);
</script>

<div class={`group relative mt-3 rounded-lg border border-dashed px-3 py-2.5 ${styles.container}`}>
	<button
		onclick={onEdit}
		class="absolute top-2 right-2 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
		aria-label="Edit note"
	>
		<PencilIcon class="size-3 text-muted-foreground" />
	</button>

	<!-- Category label -->
	{#if note.category}
		<p class={`mb-1.5 text-[9px] font-bold tracking-wider uppercase ${styles.label}`}>
			{categoryLabels[note.category]}
		</p>
	{/if}

	<!-- Author row -->
	<div class="mb-1.5 flex items-center gap-1.5">
		<div
			class={`flex size-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold ${styles.avatar}`}
		>
			{note.reviewerInitials}
		</div>
		<span class={`text-[10px] ${styles.meta}`}>{note.reviewerName} · {note.timestamp}</span>
	</div>

	<!-- Note body -->
	<p class="text-[12px] leading-relaxed text-foreground">{note.note}</p>
</div>
