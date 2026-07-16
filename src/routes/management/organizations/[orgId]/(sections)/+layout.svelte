<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { formatLabel, getCurrentFlowStepKey, getFlowSteps, type FlowStep } from '../helpers';

	let { data, children } = $props();

	let revision = $state(0);

	afterNavigate(() => {
		revision += 1;
	});

	const organization = $derived.by(() => {
		void revision;
		return data.organization;
	});

	const orgId = $derived(organization.id);

	const flowSteps = $derived(getFlowSteps());

	const currentStepKey = $derived(getCurrentFlowStepKey(page.url.pathname, page.url.searchParams));

	function flowStepHref(step: FlowStep, organizationId: string): ResolvedPathname {
		if (step.key === 'bank') {
			return resolve('/management/organizations/[orgId]/bank', { orgId: organizationId });
		}
		if (step.key === 'documents') {
			return resolve('/management/organizations/[orgId]/documents', { orgId: organizationId });
		}
		if (step.key === 'review') {
			return resolve('/management/organizations/[orgId]/preview', { orgId: organizationId });
		}
		if (step.key === 'legal') {
			return resolve('/management/organizations/[orgId]/kyb', { orgId: organizationId });
		}
		return `${resolve('/management/organizations/[orgId]/kyb', { orgId: organizationId })}?step=${step.key}` as ResolvedPathname;
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
				{@const stepHref = flowStepHref(step, orgId)}
				<a
					href={stepHref}
					class={cn(
						'flex min-w-0 flex-1 items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap rounded-lg px-2 py-1.5 text-sm transition-colors',
						isActive
							? 'bg-primary font-medium text-primary-foreground'
							: 'text-muted-foreground hover:text-foreground'
					)}
					aria-current={isActive ? 'step' : undefined}
				>
					{step.label}
				</a>
			{/each}
		</nav>
	</div>

	<div class="rounded-xl shadow-sm border border-border bg-card px-6 py-5">
		{@render children()}
	</div>
</div>
