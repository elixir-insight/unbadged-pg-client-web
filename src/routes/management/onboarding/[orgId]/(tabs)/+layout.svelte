<script lang="ts">
	import { Avatar, Button, Modal, Chip } from '$lib/components/reusable';
	import type { BadgeVariant } from '$lib/components/ui/badge';
	import { cn } from '$lib/utils';
	import { CheckIcon, MailIcon, PhoneIcon } from '$lib/assets/icons';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { onboardingDrafts } from '$lib/stores/onboarding-draft.svelte';
	import { getOnboardingOrgById, type OnboardingOrgRecord } from '$lib/data/mockData';
	import { formatStatusLabel } from '$lib/utils/status_rename';
	import { ONBOARDING_STEPS } from '../steps';
	import { getOnboardingOrgContext } from '../onboarding-org.svelte';

	let { children } = $props();

	const onboarding = getOnboardingOrgContext();

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

	const displayStatus = $derived(onboarding.localStatus ?? onboarding.baseProfileStatus);
	const statusVariant = $derived(
		statusVariantMap[normalizeStatusKey(displayStatus)] ?? 'secondary'
	);

	const activeStepKey = $derived(
		ONBOARDING_STEPS.find((step) => page.url.pathname.endsWith(`/${step.key}`))?.key ?? 'kyb'
	);

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

	$effect(() => {
		onboarding.baseProfileStatus = org.profileStatus;
		onboarding.reset();
	});

	function handleApprove() {
		const approvedStatus = 'APPROVED';
		onboarding.localStatus = approvedStatus;
		if (onboardingDrafts.getById(String(org.orgId))) {
			onboardingDrafts.updateStatus(String(org.orgId), approvedStatus);
		}
		onboarding.showApproveModal = false;
	}

	function stepHref(stepKey: (typeof ONBOARDING_STEPS)[number]['key']) {
		const routes = {
			kyb: '/management/onboarding/[orgId]/kyb',
			account: '/management/onboarding/[orgId]/account',
			documents: '/management/onboarding/[orgId]/documents',
			integration: '/management/onboarding/[orgId]/integration'
		} as const;

		return resolve(routes[stepKey], { orgId });
	}
</script>

<div class="mx-auto max-w-3xl space-y-5">
	<div
		class="overflow-hidden rounded-2xl border border-border/40 bg-background/80 shadow-sm backdrop-blur-sm"
	>
		<div
			class="flex flex-col gap-3 border-b border-border/60 px-5 py-4 sm:flex-row sm:items-center"
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
		</div>

		<div class="border-t border-border/60 bg-muted/30 px-4 py-3">
			<nav aria-label="Onboarding steps" class="grid grid-cols-2 gap-1 sm:grid-cols-4">
				{#each ONBOARDING_STEPS as step, idx (step.key)}
					{@const active = step.key === activeStepKey}
					{@const complete = onboarding.stepsCompleted[step.key]}
					<a
						href={stepHref(step.key)}
						aria-current={active ? 'page' : undefined}
						class={cn(
							'flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors',
							active
								? 'bg-primary/10 text-primary'
								: complete
									? 'text-emerald-600 hover:bg-muted dark:text-emerald-400'
									: 'text-foreground/60 hover:bg-muted hover:text-foreground'
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
									active ? 'bg-primary text-white' : 'border-2 border-border text-muted-foreground'
								)}
							>
								{idx + 1}
							</div>
						{/if}
						<span class={cn('truncate', active && 'font-semibold')}>{step.label}</span>
					</a>
				{/each}
			</nav>
		</div>
	</div>

	{@render children()}
</div>

<Modal title="Are you sure?" bind:open={onboarding.showApproveModal}>
	<div class="space-y-5">
		<p class="text-sm text-muted-foreground">
			Are you sure you want to change the status from {formatStatusLabel(displayStatus)} to {formatStatusLabel(
				'APPROVED'
			)} ?
		</p>
		<div class="flex justify-end gap-2 border-t border-border pt-4">
			<Button variant="outline" onclick={() => (onboarding.showApproveModal = false)}>Cancel</Button
			>
			<Button class="gradient-primary text-primary-foreground" onclick={handleApprove}>
				Yes, Approve
			</Button>
		</div>
	</div>
</Modal>
