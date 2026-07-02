<script lang="ts">
	import type { Component } from 'svelte';
	import { page } from '$app/state';
	import { Button, Avatar, Modal, Chip } from '$lib/components/reusable';
	import type { BadgeVariant } from '$lib/components/ui/badge';
	import { cn } from '$lib/utils';
	import { organizations } from '$lib/data/mockData';
	import { onboardingDrafts } from '$lib/stores/onboarding-draft.svelte';
	import { getReviewSections } from '$lib/data/reviewMockData';
	import { FieldCard } from '$lib/components/review';
	import type { ReviewerNote, SectionStatus, NoteCategory } from '$lib/types/review';
	import {
		CreditCard,
		FileText,
		Plug,
		ShieldCheck,
		CheckIcon,
		ClipboardCheck,
		MessageSquareDiff,
		Check,
		RotateCcw,
		MailIcon,
		PhoneIcon
	} from '$lib/assets/icons';
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	const orgId = page.params.orgId;

	function resolveOrg(id: string) {
		return (
			onboardingDrafts.getById(id) ??
			organizations.find((o) => o.id === id) ??
			organizations.find((o) => o.status === 'IN_REVIEW')!
		);
	}

	const sectionDefs = getReviewSections(resolveOrg(orgId ?? '') as (typeof organizations)[number]);

	const org = $derived(resolveOrg(orgId ?? ''));

	const sectionIcons: Record<string, Component> = {
		overview: ClipboardCheck as Component,
		kyb: ShieldCheck as Component,
		bank: CreditCard as Component,
		documents: FileText as Component,
		integration: Plug as Component
	};

	const sectionStatusVariant: Record<SectionStatus, BadgeVariant> = {
		IN_REVIEW: 'info',
		CHANGES_REQUESTED: 'warning',
		APPROVED: 'success'
	};

	const sectionStatusLabel: Record<SectionStatus, string> = {
		IN_REVIEW: 'In Review',
		CHANGES_REQUESTED: 'Changes Requested',
		APPROVED: 'Approved'
	};

	const statusVariantMap: Record<string, BadgeVariant> = {
		PENDING: 'warning',
		IN_REVIEW: 'info',
		IN_PROGRESS: 'alert',
		APPROVED: 'success',
		ACTIVE: 'success',
		ON_HOLD: 'warning',
		REJECTED: 'error'
	};

	const ACRONYMS = new Set(['LLP']);

	function normalizeStatusKey(status: string): string {
		return status.toUpperCase().replace(/\s+/g, '_');
	}

	function formatStatusLabel(status: string): string {
		if (!status.includes('_')) return status;
		return status
			.split('_')
			.map((word) =>
				ACRONYMS.has(word) ? word : word[0].toUpperCase() + word.slice(1).toLowerCase()
			)
			.join(' ');
	}

	function getStringField(obj: object, key: string): string {
		const value = (obj as Record<string, unknown>)[key];
		return typeof value === 'string' ? value : '';
	}

	const overviewFields = $derived(sectionDefs.find((s) => s.id === 'overview')?.fields ?? []);

	interface OrgInfoPart {
		icon: typeof MailIcon;
		text: string;
	}

	const orgInfoParts = $derived(
		[
			{
				icon: MailIcon,
				text:
					getStringField(org, 'email') || overviewFields.find((f) => f.key === 'email')?.value || ''
			},
			{
				icon: PhoneIcon,
				text:
					getStringField(org, 'phone') || overviewFields.find((f) => f.key === 'phone')?.value || ''
			}
		].filter((part): part is OrgInfoPart => !!part.text)
	);

	let activeSection = $state('overview');

	function initNotes(): Record<string, ReviewerNote> {
		const initial: Record<string, ReviewerNote> = {};
		for (const section of sectionDefs) {
			for (const field of section.fields) {
				if (field.reviewerNote) {
					initial[`${section.id}:${field.key}`] = field.reviewerNote;
				}
			}
		}
		return initial;
	}
	let reviewerNotes = $state<Record<string, ReviewerNote>>(initNotes());

	let sectionStatuses = $state<Record<string, SectionStatus>>(
		Object.fromEntries(sectionDefs.map((s) => [s.id, 'IN_REVIEW' as SectionStatus]))
	);

	let resubmittedSections = $state<Set<string>>(new Set(['kyb']));
	let showFinalApproveModal = $state(false);
	let localStatus = $state<string | null>(null);

	const displayStatus = $derived(localStatus ?? String(org.status));
	const statusVariant = $derived(
		statusVariantMap[normalizeStatusKey(displayStatus)] ?? 'secondary'
	);
	const isApproved = $derived(normalizeStatusKey(displayStatus) === 'APPROVED');

	const currentSection = $derived(sectionDefs.find((s) => s.id === activeSection)!);

	const sectionNoteCounts = $derived(
		Object.fromEntries(
			sectionDefs.map((s) => [
				s.id,
				s.fields.filter((f) => reviewerNotes[`${s.id}:${f.key}`]).length
			])
		)
	);

	const approvedCount = $derived(
		Object.values(sectionStatuses).filter((s) => s === 'APPROVED').length
	);

	const allApproved = $derived(Object.values(sectionStatuses).every((s) => s === 'APPROVED'));
	const canFinalApprove = $derived(allApproved && !isApproved);

	const currentStatus = $derived(sectionStatuses[activeSection] as SectionStatus);
	const SectionIcon = $derived(sectionIcons[activeSection]);

	const currentSectionReviewNotes = $derived(
		currentSection.fields
			.map((field) => ({
				field,
				note: reviewerNotes[`${currentSection.id}:${field.key}`]
			}))
			.filter(
				(entry): entry is { field: (typeof currentSection.fields)[number]; note: ReviewerNote } =>
					Boolean(entry.note)
			)
	);

	$effect(() => {
		if (orgId) {
			localStatus = null;
		}
	});

	function saveNote(sectionId: string, fieldKey: string, noteText: string, category: NoteCategory) {
		reviewerNotes = {
			...reviewerNotes,
			[`${sectionId}:${fieldKey}`]: {
				field: fieldKey,
				reviewerName: 'You',
				reviewerInitials: 'YO',
				timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
				note: noteText,
				category
			}
		};
	}

	function handleApproveSection() {
		sectionStatuses = { ...sectionStatuses, [activeSection]: 'APPROVED' };
	}

	function handleRequestChanges() {
		if (currentSectionReviewNotes.length === 0) return;
		sectionStatuses = { ...sectionStatuses, [activeSection]: 'CHANGES_REQUESTED' };
		resubmittedSections.delete(activeSection);
	}

	function handleRevokeRequest() {
		sectionStatuses = { ...sectionStatuses, [activeSection]: 'IN_REVIEW' };
	}

	function handleRevokeApproval() {
		sectionStatuses = { ...sectionStatuses, [activeSection]: 'IN_REVIEW' };
	}

	function navigateSection(id: string) {
		activeSection = id;
	}

	function handleFinalApprove() {
		localStatus = 'APPROVED';
		if (onboardingDrafts.getById(org.id)) {
			onboardingDrafts.updateStatus(org.id, 'APPROVED');
		}
		showFinalApproveModal = false;
	}
</script>

<div class="p-6">
	<div class="mx-auto max-w-6xl space-y-5">
		<!-- Header card -->
		<div
			class="overflow-hidden rounded-2xl border border-border/40 bg-background/80 shadow-sm backdrop-blur-sm"
		>
			<div
				class="flex flex-col gap-3 border-b border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
			>
				<div class="flex min-w-0 items-center gap-3">
					<Avatar name={org.name} size="default" shape="square" />
					<div class="min-w-0 leading-tight">
						<h1 class="truncate text-base font-semibold tracking-tight">{org.name}</h1>
						<div class="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
							{#each orgInfoParts as part, i (part.text + i)}
								{#if i > 0}
									<span class="text-border">•</span>
								{/if}
								<span class="inline-flex items-center gap-1">
									<part.icon class="size-3.5 shrink-0" />
									{part.text}
								</span>
							{/each}
						</div>
					</div>
				</div>
				<div class="flex shrink-0 flex-wrap items-center gap-2">
					<Chip variant={statusVariant}>{formatStatusLabel(displayStatus)}</Chip>
					<Button
						size="sm"
						class="gradient-primary text-primary-foreground"
						disabled={!canFinalApprove}
						onclick={() => (showFinalApproveModal = true)}
					>
						<ShieldCheck class="size-4" />
						Approve
					</Button>
				</div>
			</div>
		</div>

		<!-- Body -->
		<div class="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-start">
			<main class="w-full min-w-0 lg:flex-1">
				{#key activeSection}
					<div in:fly={{ y: 8, duration: 200, easing: cubicOut }} out:fade={{ duration: 60 }}>
						<div
							class="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/40 bg-background/80 px-4 py-3.5 shadow-sm backdrop-blur-sm sm:px-5"
						>
							<div class="flex items-center gap-3">
								<div
									class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
								>
									{#if SectionIcon}
										<SectionIcon class="size-4.5" />
									{/if}
								</div>
								<div>
									<h2 class="text-sm font-semibold leading-none">{currentSection.label}</h2>
									<p class="mt-0.5 text-xs text-muted-foreground">{currentSection.subLabel}</p>
								</div>
							</div>
							<div class="flex items-center gap-2">
								<Chip variant={sectionStatusVariant[currentStatus]}>
									{sectionStatusLabel[currentStatus]}
								</Chip>
								<span class="text-xs font-semibold tabular-nums text-muted-foreground">
									{approvedCount}/{sectionDefs.length}
								</span>
							</div>
						</div>

						{#if resubmittedSections.has(activeSection)}
							<div
								class="mb-5 flex gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3.5 dark:border-amber-800/40 dark:bg-amber-950/20"
								in:fly={{ y: -4, duration: 200, easing: cubicOut }}
							>
								<RotateCcw class="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
								<div>
									<p class="text-sm font-semibold text-amber-800 dark:text-amber-300">
										Merchant resubmitted this section
									</p>
									<p class="mt-0.5 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
										System-generated remarks from the previous review have been cleared. Please
										review the updated information carefully before taking action.
									</p>
								</div>
							</div>
						{/if}

						<div class="flex flex-col gap-3">
							{#each currentSection.fields as field (field.key)}
								<FieldCard
									{field}
									reviewerNote={reviewerNotes[`${currentSection.id}:${field.key}`]}
									onSave={(note, category) =>
										saveNote(currentSection.id, field.key, note, category)}
								/>
							{/each}
						</div>

						<div class="mt-5">
							{#if currentStatus === 'APPROVED'}
								<div
									class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3.5 dark:border-emerald-800/40 dark:bg-emerald-950/20"
									in:fly={{ y: 4, duration: 180, easing: cubicOut }}
								>
									<div class="flex items-center gap-2.5">
										<div
											class="flex size-7 items-center justify-center rounded-full bg-emerald-500 shadow-sm"
										>
											<Check class="size-4 text-white" strokeWidth={2.5} />
										</div>
										<div>
											<p class="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
												Section Approved
											</p>
											<p class="text-xs text-emerald-600 dark:text-emerald-400">
												This section will be included in the final approval.
											</p>
										</div>
									</div>
									<Button variant="outline" size="sm" onclick={handleRevokeApproval}>Revoke</Button>
								</div>
							{:else if currentStatus === 'CHANGES_REQUESTED'}
								<div
									class="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 dark:border-amber-800/40 dark:bg-amber-950/20"
									in:fly={{ y: 4, duration: 180, easing: cubicOut }}
								>
									<div class="flex flex-wrap items-start justify-between gap-3">
										<div class="flex min-w-0 flex-1 items-start gap-3">
											<MessageSquareDiff
												class="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
											/>
											<div class="min-w-0 flex-1">
												<p class="text-sm font-semibold text-amber-800 dark:text-amber-300">
													Changes Requested
												</p>
												{#if currentSectionReviewNotes.length > 0}
													<ul class="mt-2 space-y-2">
														{#each currentSectionReviewNotes as { field, note } (field.key)}
															<li
																class="rounded-lg border border-amber-200/70 bg-background/60 px-3 py-2 dark:border-amber-800/40"
															>
																<p
																	class="text-[10px] font-semibold tracking-wide text-amber-800 uppercase dark:text-amber-300"
																>
																	{field.label}
																</p>
																<p
																	class="mt-1 text-xs leading-relaxed text-amber-700 dark:text-amber-400"
																>
																	{note.note}
																</p>
															</li>
														{/each}
													</ul>
												{/if}
												<p class="mt-2 text-[11px] text-amber-600 dark:text-amber-500">
													Awaiting merchant resubmission.
												</p>
											</div>
										</div>
										<Button variant="outline" size="sm" onclick={handleRevokeRequest}>
											Revoke
										</Button>
									</div>
								</div>
							{:else}
								<div
									class="flex flex-col gap-4 rounded-2xl border border-border/40 bg-background/80 px-4 py-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-5"
									in:fly={{ y: 4, duration: 180, easing: cubicOut }}
								>
									<div>
										<p class="text-sm font-medium">Ready to decide?</p>
										<p class="mt-0.5 text-xs text-muted-foreground">
											Accept this section or send saved field reviews back to the merchant.
										</p>
									</div>
									<div class="flex shrink-0 flex-wrap gap-2">
										<Button
											variant="outline"
											size="sm"
											disabled={currentSectionReviewNotes.length === 0}
											onclick={handleRequestChanges}
											class="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700/50 dark:text-amber-400 dark:hover:bg-amber-950/20"
										>
											<MessageSquareDiff class="size-4" />
											Send for Changes
										</Button>
										<Button
											size="sm"
											onclick={handleApproveSection}
											class="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
										>
											<Check class="size-4" />
											Accept
										</Button>
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/key}
			</main>

			<aside class="w-full shrink-0 lg:sticky lg:top-6 lg:w-72 lg:self-start">
				<div
					class="overflow-hidden rounded-2xl border border-border/40 bg-background/80 shadow-sm backdrop-blur-sm"
				>
					<div class="border-b border-border/30 px-4 py-3.5">
						<p class="text-sm font-semibold">Sections</p>
						<p class="text-xs text-muted-foreground">
							{approvedCount} of {sectionDefs.length} approved
						</p>
					</div>

					<nav class="flex flex-col gap-0.5 p-2">
						{#each sectionDefs as section (section.id)}
							{@const SectionNavIcon = sectionIcons[section.id]}
							{@const isActive = activeSection === section.id}
							{@const status = sectionStatuses[section.id]}
							{@const noteCount = sectionNoteCounts[section.id]}
							{@const flagCount = section.systemFlags.length}
							<button
								onclick={() => navigateSection(section.id)}
								class={cn(
									'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors',
									isActive
										? 'bg-primary/10 text-primary'
										: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
								)}
							>
								{#if SectionNavIcon}
									<SectionNavIcon class="size-4 shrink-0" />
								{/if}
								<div class="min-w-0 flex-1">
									<p class={cn('truncate text-sm font-medium', isActive && 'text-primary')}>
										{section.label}
									</p>
									<div class="mt-1">
										<Chip variant={sectionStatusVariant[status]}>
											{sectionStatusLabel[status]}
										</Chip>
									</div>
								</div>
								{#if flagCount > 0 || noteCount > 0}
									<span
										class="flex min-w-5 items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground"
									>
										{flagCount > 0 ? flagCount : noteCount}
									</span>
								{:else if status === 'APPROVED'}
									<div
										class="flex size-5 items-center justify-center rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30"
									>
										<CheckIcon class="size-3 text-white" />
									</div>
								{/if}
							</button>
						{/each}
					</nav>

					<div class="border-t border-border/30 p-4">
						{#if canFinalApprove}
							<Button
								class="w-full gradient-primary text-primary-foreground"
								size="sm"
								onclick={() => (showFinalApproveModal = true)}
							>
								<ShieldCheck class="size-4" />
								Approve Organization
							</Button>
						{:else if isApproved}
							<p class="text-center text-xs text-muted-foreground">Organization approved</p>
						{:else}
							<p class="text-center text-xs text-muted-foreground">
								Approve all sections to enable final approval
							</p>
						{/if}
					</div>
				</div>
			</aside>
		</div>
	</div>
</div>

<Modal title="Are you sure?" bind:open={showFinalApproveModal}>
	<div class="space-y-5">
		<p class="text-sm text-muted-foreground">
			Are you sure you want to change the status from {formatStatusLabel(displayStatus)} to Approved ?
		</p>
		<div class="flex justify-end gap-2 border-t border-border pt-4">
			<Button variant="outline" onclick={() => (showFinalApproveModal = false)}>Cancel</Button>
			<Button class="gradient-primary text-primary-foreground" onclick={handleFinalApprove}>
				Yes, Approve
			</Button>
		</div>
	</div>
</Modal>
