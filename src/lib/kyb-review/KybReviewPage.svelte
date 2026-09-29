<script lang="ts">
	import { untrack } from 'svelte';
	import { Button } from '$lib/components/reusable';
	import { page } from '$app/state';
	import { invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Organization } from '$lib/data/mockData';
	import { DocumentPreviewModal } from '$lib/components/document-preview';
	import { submitSectionReview } from './api';
	import LeaveDialog from './LeaveDialog.svelte';
	import ReviewField from './ReviewField.svelte';
	import ReviewSummary from './ReviewSummary.svelte';
	import ReviewDecisionFooter from './ReviewDecisionFooter.svelte';
	import { KybReviewState } from './review.svelte';
	import type { ProfileFormOptions } from './profile';
	import {
		REVIEW_TABS,
		type FieldReview,
		type ReviewField as ReviewFieldData,
		type ReviewSection,
		type ReviewTab
	} from './types';

	let {
		organization,
		sections,
		verifications,
		profileOptions,
		onContinue
	}: {
		organization: Organization;
		sections: ReviewSection[];
		verifications: Record<string, FieldReview>;
		profileOptions: ProfileFormOptions;
		onContinue: (href: string) => void;
	} = $props();

	const review = new KybReviewState(
		() => sections,
		() => verifications,
		async (payload) => {
			await submitSectionReview(organization.id, payload);
			// Refetch GET /verifications so statuses come from the server, not local guesses.
			await invalidate('kyb:verifications');
		}
	);

	$effect(() => {
		const next = verifications;
		untrack(() => review.sync(next));
	});

	let dialogOpen = $state(false);
	let previewOpen = $state(false);
	let previewField = $state<ReviewFieldData | null>(null);

	function openPreview(field: ReviewFieldData) {
		if (!field.href) return;
		previewField = field;
		previewOpen = true;
	}

	function isTab(value: string): value is ReviewTab {
		return (REVIEW_TABS as readonly string[]).includes(value);
	}

	function stepHref(tab: ReviewTab): string {
		const kybPath = resolve(`/management/organizations/${organization.id}/kyb` as '/');
		return tab === 'legal' ? kybPath : `${kybPath}?step=${tab}`;
	}

	const stepFromUrl = $derived.by((): ReviewTab => {
		const step = page.url.searchParams.get('step') ?? 'legal';
		return isTab(step) ? step : 'legal';
	});

	/** Called by the route before navigating away; true means the leave dialog took over. */
	export function blockNavigation(href: string): boolean {
		if (review.unsavedCount(review.activeTab) === 0) return false;
		review.promptHref(href);
		dialogOpen = true;
		return true;
	}

	$effect(() => {
		const step = stepFromUrl;
		if (step !== review.activeTab) review.activate(step);
	});

	$effect(() => {
		if (!dialogOpen) review.stay();
	});

	function requestTab(next: string) {
		if (!isTab(next) || next === review.activeTab) return;

		const href = stepHref(next);
		if (review.unsavedCount(review.activeTab) > 0) {
			review.promptHref(href);
			dialogOpen = true;
			return;
		}

		onContinue(href);
	}

	function discardAndContinue() {
		const href = review.confirmDiscard();
		dialogOpen = false;
		if (href) onContinue(href);
	}

	async function submitAndContinue() {
		const href = review.pendingHref;
		const tab = review.leaveTo ?? undefined;
		const ok = await review.submit(tab);
		dialogOpen = false;
		if (ok && href) onContinue(href);
	}

	const nextTab = $derived(review.nextTab());
	const activeSection = $derived(sections.find((item) => item.id === review.activeTab));
	const dialogSection = $derived(review.activeTab);
	const currentProfile = $derived({
		profileType: organization.category,
		serviceTypes: organization.serviceTypes,
		affiliateId: organization.affiliateId ?? ''
	});
</script>

{#snippet sectionPanel(section: ReviewSection)}
	<div class="flex flex-col gap-4">
		{#if section.id === review.activeTab && review.message?.type === 'success'}
			<p class="text-sm text-success" role="status">{review.message.text}</p>
		{:else if section.id === review.activeTab && review.message?.type === 'error'}
			<p class="text-sm text-destructive" role="alert">{review.message.text}</p>
		{/if}

		{#if section.fields.length === 0}
			<p class="text-sm text-muted-foreground">Nothing to review in this section.</p>
		{:else}
			<div class="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
				{#each section.fields as field (field.fieldName)}
					<ReviewField
						{field}
						tracked={Object.hasOwn(verifications, field.fieldName)}
						draft={review.draftFor(field.fieldName)}
						changed={review.isFieldChanged(field.fieldName)}
						showSaved={review.showsSaved(field.fieldName)}
						invalid={review.showNoteError(field.fieldName)}
						disabled={review.submitting}
						onStatus={(status) => review.setStatus(field.fieldName, status)}
						onRemarks={(remarks) => review.setRemarks(field.fieldName, remarks)}
						onUndo={() => review.undo(field.fieldName)}
						onView={() => openPreview(field)}
					/>
				{/each}
			</div>
		{/if}

		{#if review.unsavedCount(section.id) > 0}
			<div
				class="flex flex-col gap-3 rounded-lg border border-ring bg-accent px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
			>
				<div class="min-w-0">
					<p class="text-sm font-medium text-foreground">{review.unsavedMessage(section.id)}</p>
					{#if review.missingNoteCount(section.id) > 0}
						<p class="mt-1 text-sm text-destructive">{review.missingNoteMessage(section.id)}</p>
					{:else}
						<p class="mt-1 text-sm text-muted-foreground">{review.changeSummary(section.id)}</p>
					{/if}
				</div>
				<div class="flex shrink-0 flex-wrap gap-2">
					<Button
						variant="outline"
						disabled={review.submitting}
						onclick={() => review.discardActive()}
					>
						Discard
					</Button>
					<Button
						disabled={review.missingNoteCount(section.id) > 0 || review.submitting}
						onclick={() => review.submit()}
					>
						{review.submitting ? 'Submitting…' : `Submit ${review.label(section.id)} review`}
					</Button>
				</div>
			</div>
		{/if}

		<div class="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
			<Button variant="outline" href="/management/organizations">Cancel</Button>
			{#if nextTab && section.id === review.activeTab}
				<Button type="button" onclick={() => requestTab(nextTab)}>Next step</Button>
			{/if}
		</div>
	</div>
{/snippet}

{#if review.activeTab === 'review'}
	<div class="flex flex-col gap-4">
		<ReviewSummary
			{sections}
			saved={review.saved}
			tabLabel={(sectionId) => review.label(sectionId)}
			onOpen={requestTab}
		/>
		<ReviewDecisionFooter
			orgId={organization.id}
			profileStatus={organization.status}
			{sections}
			saved={review.saved}
			profile={currentProfile}
			{profileOptions}
		/>
		<div class="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
			<Button variant="outline" href="/management/organizations">Cancel</Button>
		</div>
	</div>
{:else if activeSection}
	{@render sectionPanel(activeSection)}
{/if}

<LeaveDialog
	bind:open={dialogOpen}
	title={`Submit ${review.label(dialogSection)} review first?`}
	description={review.leaveBody(dialogSection)}
	missingNoteMessage={review.missingNoteCount(dialogSection) > 0
		? review.missingNoteMessage(dialogSection)
		: ''}
	submitting={review.submitting}
	submitDisabled={review.missingNoteCount(dialogSection) > 0}
	onStay={() => {
		dialogOpen = false;
	}}
	onDiscard={discardAndContinue}
	onSubmit={submitAndContinue}
/>

<DocumentPreviewModal
	bind:open={previewOpen}
	title={previewField?.label ?? 'Document preview'}
	previewUrl={previewField?.href ?? ''}
	fileType={previewField?.fileType}
/>
