<script lang="ts">
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import {
		formatLabel,
		flowStepHref,
		getCurrentFlowNavStepKey,
		getFlowNavSteps,
		isOrgOnboardingSectionPath,
		isPostOnboardingStatus,
		type FlowStep
	} from '../helpers';

	let { data, children } = $props();

	let revision = $state(0);
	let sectionLoading = $state(false);

	beforeNavigate(({ from, to }) => {
		if (!from || !to) return;

		const sectionChanged = from.url.pathname !== to.url.pathname;
		const enteringSection = isOrgOnboardingSectionPath(to.url.pathname);

		if (sectionChanged && enteringSection) {
			sectionLoading = true;
			return () => {
				sectionLoading = false;
			};
		}
	});

	afterNavigate(() => {
		sectionLoading = false;
		revision += 1;
	});

	const organization = $derived.by(() => {
		void revision;
		return data.organization;
	});

	const orgId = $derived(organization.id);

	const isPostOnboarding = $derived(isPostOnboardingStatus(organization.status));

	const flowSteps = $derived(getFlowNavSteps(organization.status));

	const reviewStepKeys = new Set<FlowStep['key']>([
		'legal',
		'address',
		'directors',
		'bank',
		'documents',
		'review'
	]);

	const currentStepKey = $derived.by((): FlowStep['key'] => {
		if (organization.status === 'IN_REVIEW' && page.url.pathname.includes('/kyb')) {
			const step = page.url.searchParams.get('step') ?? 'legal';
			if (reviewStepKeys.has(step as FlowStep['key'])) return step as FlowStep['key'];
		}
		return getCurrentFlowNavStepKey(page.url.pathname, page.url.searchParams, organization.status);
	});

	const showSectionNavigation = $derived(!(isPostOnboarding && currentStepKey === 'review'));

	/** Unresolved step path; the template passes it through resolve(). */
	function stepPath(step: FlowStep, organizationId: string): string {
		if (organization.status === 'IN_REVIEW') {
			const kybPath = `/management/organizations/${organizationId}/kyb`;
			return step.key === 'legal' ? kybPath : `${kybPath}?step=${step.key}`;
		}
		return flowStepHref(organizationId, step.key);
	}
</script>

<div class="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 sm:px-8">
	<div class="rounded-xl border border-border bg-card px-6 py-5 shadow-sm">
		<header class={cn(showSectionNavigation && 'mb-5')}>
			<h1 class="text-lg font-medium">{organization.name}</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				{formatLabel(organization.businessType)} · {formatLabel(organization.status)}
			</p>
		</header>

		{#if showSectionNavigation}
			<nav
				aria-label={isPostOnboarding ? 'Profile sections' : 'Onboarding steps'}
				class="flex gap-0.5 rounded-lg bg-muted p-1"
			>
				{#each flowSteps as step (step.key)}
					{@const isActive = step.key === currentStepKey}
					{@const stepHref = stepPath(step, orgId)}
					<a
						href={resolve(stepHref as '/')}
						aria-disabled={sectionLoading}
						tabindex={sectionLoading ? -1 : undefined}
						class={cn(
							'flex min-w-0 flex-1 items-center justify-center overflow-hidden rounded-lg px-2 py-1.5 text-sm text-ellipsis whitespace-nowrap transition-colors',
							isActive
								? 'bg-primary font-medium text-primary-foreground'
								: 'text-muted-foreground hover:text-foreground',
							sectionLoading && 'pointer-events-none opacity-60'
						)}
						aria-current={isActive ? 'step' : undefined}
					>
						{step.label}
					</a>
				{/each}
			</nav>
		{/if}
	</div>

	<div class="relative min-h-112 rounded-xl border border-border bg-card px-6 py-5 shadow-sm">
		{#if sectionLoading}
			<div
				class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-xl bg-card/90 backdrop-blur-[1px]"
				role="status"
				aria-live="polite"
				aria-label="Loading section"
			>
				<Skeleton class="size-10 rounded-full" />
				<div class="space-y-2 text-center">
					<Skeleton class="mx-auto h-4 w-32" />
					<Skeleton class="mx-auto h-3 w-48" />
				</div>
				<p class="text-sm text-muted-foreground">Loading section…</p>
			</div>
		{/if}

		{@render children()}
	</div>
</div>
