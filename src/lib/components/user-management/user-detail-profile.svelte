<script lang="ts">
	import { resolve } from '$app/paths';
	import { MailIcon, PhoneIcon, Shield, ShieldCheck, Users } from '$lib/assets/icons';
	import { Chip } from '$lib/components/reusable';
	import * as Avatar from '$lib/components/ui/avatar';
	import type { BadgeVariant } from '$lib/components/ui/badge';
	import { cn } from '$lib/utils';
	import type {
		UserAssignedUser,
		UserReportingManager,
		UserStatus
	} from '$lib/stores/user-management/user-management';
	import type { Snippet } from 'svelte';
	import type { UserOverviewField } from './user-overview-fields';

	let {
		name,
		email,
		employeeId = '',
		phoneDisplay = '',
		status,
		roles = [],
		overviewFields = [],
		initials,
		bannerAction,
		actions,
		showStatusChip = true,
		assignedUsers,
		reportingManager,
		getUserHref
	}: {
		name: string;
		email: string;
		employeeId?: string;
		phoneDisplay?: string;
		status?: UserStatus;
		roles?: string[];
		overviewFields?: UserOverviewField[];
		initials: string;
		bannerAction?: Snippet;
		actions?: Snippet;
		showStatusChip?: boolean;
		assignedUsers?: UserAssignedUser[];
		reportingManager?: UserReportingManager | null;
		getUserHref?: (id: string) => string;
	} = $props();

	const hasPhone = $derived(Boolean(phoneDisplay && phoneDisplay !== '—'));

	function statusVariant(currentStatus: UserStatus): BadgeVariant {
		return currentStatus === 'Active' ? 'success' : 'info';
	}
</script>

<div class="m-auto flex w-full flex-col gap-6 md:w-[75%]">
	<section class="overflow-hidden rounded-xl border border-border bg-card">
		<div class="relative h-28 bg-muted sm:h-32">
			{#if bannerAction}
				<div class="absolute top-3 right-3 sm:top-4 sm:right-4">
					{@render bannerAction()}
				</div>
			{/if}
		</div>

		<div class="relative px-4 pb-6 sm:px-6">
			<div class="absolute -top-10 left-4 sm:-top-12 sm:left-6">
				<Avatar.Root class="size-20 border-4 border-card bg-muted sm:size-24">
					<Avatar.Fallback class="bg-primary text-lg font-bold text-primary-foreground sm:text-xl">
						{initials}
					</Avatar.Fallback>
				</Avatar.Root>
			</div>

			<div class="pt-12 sm:pt-14">
				<div class="flex flex-wrap items-center gap-2">
					<h2 class="text-xl font-bold text-foreground">{name}</h2>
					{#if showStatusChip && status}
						<Chip variant={statusVariant(status)}>{status}</Chip>
					{/if}
				</div>
				{#if employeeId}
					<p class="mt-0.5 text-sm text-muted-foreground">@{employeeId}</p>
				{/if}

				<ul class="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
					<li class="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
						<MailIcon class="size-4 shrink-0" aria-hidden="true" />
						<a
							href="mailto:{email}"
							class="truncate text-foreground transition-colors hover:text-primary"
						>
							{email}
						</a>
					</li>
					{#if hasPhone}
						<li class="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
							<PhoneIcon class="size-4 shrink-0" aria-hidden="true" />
							<a
								href="tel:{phoneDisplay}"
								class="truncate text-foreground transition-colors hover:text-primary"
							>
								{phoneDisplay}
							</a>
						</li>
					{/if}
					{#if reportingManager !== undefined}
						<li class="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
							<Users class="size-4 shrink-0" aria-hidden="true" />
							<span class="shrink-0">Reporting to</span>
							{#if reportingManager && getUserHref}
								<a
									href={resolve(
										...([getUserHref(reportingManager.id)] as Parameters<typeof resolve>)
									)}
									class="truncate font-medium text-foreground transition-colors hover:text-primary"
								>
									{reportingManager.name}
								</a>
							{:else}
								<span class="truncate font-medium text-foreground">
									{reportingManager?.name ?? '—'}
								</span>
							{/if}
						</li>
					{/if}
				</ul>
			</div>
		</div>
	</section>

	{#if overviewFields.length > 0}
		<section class="overflow-hidden rounded-xl border border-border bg-card">
			{#each overviewFields as field, index (field.label)}
				<div
					class={cn(
						'flex min-h-11 flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5',
						index < overviewFields.length - 1 && 'border-b border-border/40'
					)}
				>
					<span class="shrink-0 text-sm text-muted-foreground">{field.label}</span>
					<div class="min-w-0 sm:text-right">
						{#if field.kind === 'email'}
							<a
								href="mailto:{field.value}"
								class="text-sm font-medium text-foreground transition-colors hover:text-primary"
							>
								{field.value}
							</a>
						{:else if field.kind === 'tel'}
							<a
								href="tel:{field.value}"
								class="text-sm font-medium text-foreground transition-colors hover:text-primary"
							>
								{field.value}
							</a>
						{:else}
							<span class="text-sm font-medium text-foreground">{field.value}</span>
						{/if}
						{#if field.subtitle}
							<p class="mt-0.5 truncate text-xs text-muted-foreground">{field.subtitle}</p>
						{/if}
					</div>
				</div>
			{/each}
		</section>
	{/if}

	<section class="overflow-hidden rounded-xl border border-border bg-card">
		<div class="flex items-center gap-2 border-b border-border/40 px-4 py-3 sm:px-5">
			<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
				<Shield class="h-4 w-4" />
			</div>
			<h3 class="text-sm font-semibold text-foreground">Assigned Roles</h3>
			<Chip class="h-5 rounded-full px-2 text-xs">{roles.length}</Chip>
		</div>

		{#if roles.length > 0}
			<div class="flex flex-wrap gap-2 px-4 py-4 sm:px-5">
				{#each roles as role (role)}
					<Chip
						variant="outline"
						class="h-auto min-h-8 gap-2 rounded-md border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-medium text-foreground [&>svg]:size-4!"
					>
						<ShieldCheck class="size-4 text-primary" />
						{role}
					</Chip>
				{/each}
			</div>
		{:else}
			<div class="px-4 py-4 sm:px-5">
				<p class="text-sm text-muted-foreground">No roles assigned.</p>
			</div>
		{/if}
	</section>

	{#if assignedUsers}
		<section class="overflow-hidden rounded-xl border border-border bg-card">
			<div class="flex items-center gap-2 border-b border-border/40 px-4 py-3 sm:px-5">
				<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<Users class="h-4 w-4" aria-hidden="true" />
				</div>
				<h3 class="text-sm font-semibold text-foreground">Assigned Users</h3>
				<Chip class="h-5 rounded-full px-2 text-xs">{assignedUsers.length}</Chip>
			</div>

			{#if assignedUsers.length > 0}
				<div class="flex flex-wrap gap-2 px-4 py-4 sm:px-5">
					{#each assignedUsers as assignedUser (assignedUser.id)}
						{#if getUserHref}
							<a
								href={resolve(...([getUserHref(assignedUser.id)] as Parameters<typeof resolve>))}
								class="rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
							>
								{assignedUser.name}
							</a>
						{:else}
							<span
								class="rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-medium text-foreground"
							>
								{assignedUser.name}
							</span>
						{/if}
					{/each}
				</div>
			{:else}
				<div class="px-4 py-4 sm:px-5">
					<p class="text-sm text-muted-foreground">No users assigned.</p>
				</div>
			{/if}
		</section>
	{/if}

	{#if actions}
		<div class="flex justify-end gap-2 pb-2">
			{@render actions()}
		</div>
	{/if}
</div>
