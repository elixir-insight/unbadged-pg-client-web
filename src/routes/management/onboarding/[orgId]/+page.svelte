<script lang="ts">
	import { Avatar, Button, Modal, Chip } from '$lib/components/reusable';
	import type { BadgeVariant } from '$lib/components/ui/badge';
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { cn } from '$lib/utils';
	import {
		Building2,
		CreditCard,
		FileText,
		Plug,
		ShieldCheck,
		CheckIcon,
		XIcon,
		MailIcon,
		PhoneIcon
	} from '$lib/assets/icons';
	import { AlignJustify } from '$lib/assets/icons';
	import KybDetails from '$lib/components/onboarding/KybDetails.svelte';
	import BankDetails from '$lib/components/onboarding/BankDetails.svelte';
	import Documents from '$lib/components/onboarding/Documents.svelte';
	import Integration from '$lib/components/onboarding/Integration.svelte';

	const steps = [
		{ key: 'kyb', label: 'KYB', description: 'Business verification', icon: Building2 },
		{ key: 'account', label: 'Account', description: 'Banking', icon: CreditCard },
		{ key: 'documents', label: 'Documents', description: 'Upload files', icon: FileText },
		{ key: 'integration', label: 'Integration', description: 'API & webhook', icon: Plug }
	] as const;

	// ── Shared state (directors used by KYB + Documents steps) ───────
	interface Director {
		id: number;
		name: string;
		aadhaar: string;
		pan: string;
		email: string;
		phone: string;
	}
	let directors = $state<Director[]>([
		{ id: 1, name: '', aadhaar: '', pan: '', email: '', phone: '' }
	]);
	let nextDirectorId = $state(2);
	let directorDocFiles = $state<Record<number, { aadhaar: File | null; pan: File | null }>>({
		1: { aadhaar: null, pan: null }
	});

	// ── Navigation ───────────────────────────────────────────────────
	let activeStep = $state(0);
	let maxReachedStep = $state(0);

	const stepValid = $state({
		kyb: false,
		account: false,
		documents: false,
		integration: false
	});

	const stepsCompleted = $state({
		kyb: false,
		account: false,
		documents: false,
		integration: false
	});

	function goToStep(step: number) {
		activeStep = step;
		if (step > maxReachedStep) maxReachedStep = step;
	}

	function completeKybStep() {
		stepsCompleted.kyb = true;
		goToStep(1);
	}

	function completeAccountStep() {
		stepsCompleted.account = true;
		goToStep(2);
	}

	function completeDocumentsStep() {
		stepsCompleted.documents = true;
		goToStep(3);
	}

	function completeIntegrationStep() {
		stepsCompleted.integration = true;
		if (!isApproved && allStepsCompleted && allStepsValid) {
			showApproveModal = true;
		}
	}

	function resetStepProgress() {
		stepsCompleted.kyb = false;
		stepsCompleted.account = false;
		stepsCompleted.documents = false;
		stepsCompleted.integration = false;
		stepValid.kyb = false;
		stepValid.account = false;
		stepValid.documents = false;
		stepValid.integration = false;
		activeStep = 0;
		maxReachedStep = 0;
	}

	const allStepsCompleted = $derived(Object.values(stepsCompleted).every(Boolean));
	const allStepsValid = $derived(Object.values(stepValid).every(Boolean));

	const progressPercent = $derived(
		maxReachedStep === 0 ? 8 : Math.round((maxReachedStep / (steps.length - 1)) * 100)
	);

	// ── Approval modal ───────────────────────────────────────────────
	let showApproveModal = $state(false);
	let localStatus = $state<string | null>(null);

	const statusVariantMap: Record<string, BadgeVariant> = {
		PENDING: 'warning',
		IN_REVIEW: 'info',
		IN_PROGRESS: 'alert',
		APPROVED: 'success',
		ACTIVE: 'success',
		ON_HOLD: 'warning',
		REJECTED: 'error'
	};

	function normalizeStatusKey(status: string): string {
		return status.toUpperCase().replace(/\s+/g, '_');
	}

	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { onboardingDrafts } from '$lib/stores/onboarding-draft.svelte';
	import { getOnboardingOrgById, type OnboardingOrgRecord } from '$lib/data/mockData';
	import { formatStatusLabel } from '$lib/utils/status_rename';

	const orgId = $derived(page.params.orgId ?? '');

	const org = $derived.by((): OnboardingOrgRecord => {
		const mockOrg = getOnboardingOrgById(orgId);
		if (mockOrg) return mockOrg;

		const draft = onboardingDrafts.getById(orgId);
		if (draft) {
			return {
				orgId: draft.id,
				legalCompanyName: draft.name,
				businessType: draft.businessType,
				profileStatus: draft.status,
				profileType: draft.profileType,
				affiliateId: draft.affiliateId ? Number(draft.affiliateId) : 0,
				userEmail: draft.email,
				phoneNumber: draft.phone,
				createdAt: draft.createdAt,
				bankAccounts: [],
				kyb: {
					businessPan: undefined,
					gstNumber: undefined,
					cin: undefined,
					tan: undefined,
					businessPhone: undefined,
					organizationWebsite: undefined,
					industry: undefined,
					registeredYear: null,
					communicationAddress: undefined
				},
				addressDetails: {
					address: undefined,
					city: undefined,
					state: undefined,
					country: undefined,
					pinCode: undefined
				},
				directors: [],
				integration: { ipAddress: '' },
				documents: [],
				createdBy: 0,
				updatedBy: 0
			};
		}

		return {
			orgId,
			legalCompanyName: 'Organization',
			businessType: '—',
			profileStatus: 'IN_PROGRESS',
			profileType: 'MERCHANT',
			affiliateId: 0,
			userEmail: '',
			phoneNumber: '',
			createdAt: '',
			bankAccounts: [],
			kyb: {
				businessPan: undefined,
				gstNumber: undefined,
				cin: undefined,
				tan: undefined,
				businessPhone: undefined,
				organizationWebsite: undefined,
				industry: undefined,
				registeredYear: null,
				communicationAddress: undefined
			},
			addressDetails: {
				address: undefined,
				city: undefined,
				state: undefined,
				country: undefined,
				pinCode: undefined
			},
			directors: [],
			integration: { ipAddress: '' },
			documents: [],
			createdBy: 0,
			updatedBy: 0
		};
	});

	const displayStatus = $derived(localStatus ?? org.profileStatus);
	const statusVariant = $derived(
		statusVariantMap[normalizeStatusKey(displayStatus)] ?? 'secondary'
	);
	const isApproved = $derived(normalizeStatusKey(displayStatus) === 'APPROVED');
	const canApprove = $derived(!isApproved && allStepsCompleted && allStepsValid);

	$effect(() => {
		localStatus = null;
		resetStepProgress();
	});

	function handleApprove() {
		const approvedStatus = 'APPROVED';
		localStatus = approvedStatus;
		if (onboardingDrafts.getById(String(org.orgId))) {
			onboardingDrafts.updateStatus(String(org.orgId), approvedStatus);
		}
		showApproveModal = false;
	}

	function shouldOpenStepsByDefault(status: string) {
		const normalized = normalizeStatusKey(status);
		return normalized === 'PENDING' || normalized === 'IN_PROGRESS';
	}

	interface OrgInfoPart {
		icon: typeof MailIcon;
		text: string;
	}

	const orgInfoParts = $derived(
		[
			{ icon: MailIcon, text: org.userEmail },
			{ icon: PhoneIcon, text: org.phoneNumber }
		].filter((part): part is OrgInfoPart => !!part.text)
	);

	let stepsOpen = $state(untrack(() => shouldOpenStepsByDefault(org.profileStatus)));
</script>

<div class="p-6">
	<div class="mx-auto max-w-3xl space-y-5">
		<!-- Header card: org info + step navigation -->
		<div
			class="overflow-hidden rounded-2xl border border-border/40 bg-background/80 shadow-sm backdrop-blur-sm"
		>
			<!-- Org info row -->
			<div
				class="flex flex-col gap-3 border-b border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
			>
				<div class="flex min-w-0 items-center gap-3">
					<Avatar name={org.legalCompanyName} size="default" shape="square" />
					<div class="min-w-0 leading-tight">
						<div class="flex flex-wrap items-center gap-2">
							<h1 class="truncate text-base font-semibold tracking-tight">
								{org.legalCompanyName}
							</h1>
							<Chip variant={statusVariant}>{formatStatusLabel(displayStatus)}</Chip>
						</div>
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
				<div class="flex shrink-0">
					<Button
						size="sm"
						class="gradient-primary text-primary-foreground"
						onclick={() => (showApproveModal = true)}
						disabled={!canApprove}
					>
						<ShieldCheck class="size-4" />
						Approve
					</Button>
				</div>
			</div>

			<!-- Progress + View steps row -->
			<div class="flex items-center justify-between px-5 pt-3 pb-1">
				<span class="text-xs font-medium text-muted-foreground">Review progress</span>
				<button
					onclick={() => (stepsOpen = !stepsOpen)}
					class={cn(
						'flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
						stepsOpen
							? 'border-primary/30 bg-primary/10 text-primary'
							: 'border-border text-foreground/60 hover:bg-muted hover:text-foreground'
					)}
				>
					{#if stepsOpen}
						<XIcon class="size-3.5" />
					{:else}
						<AlignJustify class="size-3.5" />
					{/if}
					<span class="hidden sm:inline">{stepsOpen ? 'Hide steps' : 'View steps'}</span>
				</button>
			</div>

			<!-- Progress bar -->
			<div class="flex items-center gap-3 px-5 pt-2 pb-4">
				<div class="h-2 flex-1 overflow-hidden rounded-full bg-border/60">
					<div
						class="h-full rounded-full bg-primary transition-all duration-500 ease-out"
						style="width: {progressPercent}%"
					></div>
				</div>
				<span class="shrink-0 text-xs font-bold text-primary">{progressPercent}%</span>
			</div>

			<!-- Collapsible steps grid -->
			{#if stepsOpen}
				<div
					transition:slide={{ duration: 220, easing: cubicOut }}
					class="border-t border-border/60 bg-muted/30 px-4 py-3"
				>
					<p
						class="mb-2.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
					>
						All steps
					</p>
					<div class="grid grid-cols-2 gap-1 sm:grid-cols-4">
						{#each steps as step, idx (step.key)}
							{@const active = idx === activeStep}
							{@const complete = idx < maxReachedStep}
							{@const canNavigate = idx <= maxReachedStep}
							<button
								onclick={() => {
									if (!canNavigate) return;
									activeStep = idx;
									stepsOpen = false;
								}}
								disabled={!canNavigate}
								class={cn(
									'flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors',
									active
										? 'bg-primary/10 text-primary'
										: complete
											? 'text-emerald-600 hover:bg-muted dark:text-emerald-400'
											: canNavigate
												? 'text-foreground/60 hover:bg-muted hover:text-foreground'
												: 'cursor-not-allowed text-muted-foreground/40'
								)}
							>
								{#if complete}
									<div
										class="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30"
									>
										<CheckIcon class="size-3 text-white" />
									</div>
								{:else}
									<div
										class={cn(
											'flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
											active
												? 'bg-primary text-white'
												: canNavigate
													? 'border-2 border-border text-muted-foreground'
													: 'border-2 border-border/40 text-muted-foreground/40'
										)}
									>
										{idx + 1}
									</div>
								{/if}
								<span class={cn('truncate', active && 'font-semibold')}>{step.label}</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Main content — keep all steps mounted so validation state persists -->
		<div>
			<div class={cn(activeStep !== 0 && 'hidden')}>
				<KybDetails
					bind:directors
					bind:nextDirectorId
					bind:directorDocFiles
					bind:isValid={stepValid.kyb}
					businessType={org.businessType}
					onnext={completeKybStep}
				/>
			</div>

			<div class={cn(activeStep !== 1 && 'hidden')}>
				<BankDetails
					bind:isValid={stepValid.account}
					onnext={completeAccountStep}
					onprev={() => (activeStep = 0)}
				/>
			</div>

			<div class={cn(activeStep !== 2 && 'hidden')}>
				<Documents
					{directors}
					bind:directorDocFiles
					bind:isValid={stepValid.documents}
					businessType={org.businessType}
					onnext={completeDocumentsStep}
					onprev={() => (activeStep = 1)}
				/>
			</div>

			<div class={cn(activeStep !== 3 && 'hidden')}>
				<Integration
					bind:isValid={stepValid.integration}
					onprev={() => (activeStep = 2)}
					onsubmit={completeIntegrationStep}
				/>
			</div>
		</div>
	</div>
</div>

<!-- Approve confirmation modal -->
<Modal title="Are you sure?" bind:open={showApproveModal}>
	<div class="space-y-5">
		<p class="text-sm text-muted-foreground">
			Are you sure you want to change the status from {formatStatusLabel(displayStatus)} to {formatStatusLabel(
				'APPROVED'
			)} ?
		</p>
		<div class="flex justify-end gap-2 border-t border-border pt-4">
			<Button variant="outline" onclick={() => (showApproveModal = false)}>Cancel</Button>
			<Button class="gradient-primary text-primary-foreground" onclick={handleApprove}>
				Yes, Approve
			</Button>
		</div>
	</div>
</Modal>
