<script lang="ts">
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import {
		formatLabel,
		flowStepHref,
		getCurrentFlowStepKey,
		getFlowSteps,
		isOrgOnboardingSectionPath,
		type FlowStep
	} from '../helpers';

	let { data, children } = $props();

	let revision = $state(0);
	let sectionLoading = $state(false);

	beforeNavigate(({ from, to }) => {
		if (!from || !to) return;

		const leavingSection = isOrgOnboardingSectionPath(from.url.pathname);
		const enteringSection = isOrgOnboardingSectionPath(to.url.pathname);
		const routeChanged = from.url.pathname !== to.url.pathname || from.url.search !== to.url.search;

		if (leavingSection && enteringSection && routeChanged) {
			sectionLoading = true;
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

	const flowSteps = $derived(getFlowSteps());

	const currentStepKey = $derived(getCurrentFlowStepKey(page.url.pathname, page.url.searchParams));

	function resolveStepHref(step: FlowStep, organizationId: string) {
		return resolve(flowStepHref(organizationId, step.key) as '/');
	}
</script>

<div class="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 sm:px-8">
	<div class="rounded-xl shadow-sm border border-border bg-card px-6 py-5">
		<header class="mb-5">
			<h1 class="text-lg font-medium">{organization.name}</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				{formatLabel(organization.businessType)} · {formatLabel(organization.status)}
			</p>
		</header>

		<nav aria-label="Onboarding steps" class="flex gap-0.5 rounded-lg bg-muted p-1">
			{#each flowSteps as step (step.key)}
				{@const isActive = step.key === currentStepKey}
				{@const stepHref = resolveStepHref(step, orgId)}
				<a
					href={stepHref}
					aria-disabled={sectionLoading}
					tabindex={sectionLoading ? -1 : undefined}
					class={cn(
						'flex min-w-0 flex-1 items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap rounded-lg px-2 py-1.5 text-sm transition-colors',
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
	</div>

	<div class="relative min-h-112 rounded-xl shadow-sm border border-border bg-card px-6 py-5">
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
