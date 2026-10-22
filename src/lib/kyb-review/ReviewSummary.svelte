<script lang="ts">
	import { Button, Chip } from '$lib/components/reusable';
	import {
		PENDING_REVIEW,
		VERIFICATION_STATUS_LABEL,
		type FieldReview,
		type ReviewSection,
		type VerificationStatus
	} from './types';

	let {
		sections,
		saved,
		tabLabel,
		onOpen
	}: {
		sections: ReviewSection[];
		saved: Record<string, FieldReview>;
		tabLabel: (sectionId: string) => string;
		onOpen: (sectionId: string) => void;
	} = $props();

	function reviewFor(fieldName: string): FieldReview {
		return saved[fieldName] ?? PENDING_REVIEW;
	}

	function chipVariant(status: VerificationStatus): 'success' | 'warning' | 'error' {
		if (status === 'VERIFIED') return 'success';
		if (status === 'REJECTED') return 'error';
		return 'warning';
	}
</script>

<div class="flex flex-col gap-4">
	{#each sections as section (section.id)}
		<section class="flex flex-col gap-3">
			<div class="flex items-center justify-between gap-3">
				<h2 class="text-base font-semibold text-foreground">{section.title}</h2>
				<Button variant="link" size="sm" onclick={() => onOpen(section.id)}>
					Open {tabLabel(section.id)}
				</Button>
			</div>

			{#if section.fields.length === 0}
				<p class="text-sm text-muted-foreground">Nothing to review in this section.</p>
			{:else}
				<ul class="divide-y divide-border overflow-hidden rounded-lg border border-border">
					{#each section.fields as field (field.fieldName)}
						{@const review = reviewFor(field.fieldName)}
						<li class="flex items-center gap-3 bg-card px-3 py-3">
							<span class="w-40 shrink-0 text-sm font-medium text-foreground">{field.label}</span>
							<span
								class="min-w-0 flex-1 truncate text-sm {review.remarks
									? 'text-foreground'
									: 'text-muted-foreground'}"
								title={review.remarks || 'No note'}
							>
								{review.remarks || 'No note'}
							</span>
							<Chip variant={chipVariant(review.status)}>
								{VERIFICATION_STATUS_LABEL[review.status]}
							</Chip>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/each}
</div>
