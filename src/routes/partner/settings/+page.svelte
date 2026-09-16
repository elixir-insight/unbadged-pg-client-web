<script lang="ts">
	import { ChevronDown, MailIcon } from '$lib/assets/icons';
	import { Button } from '$lib/components/reusable';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Tabs from '$lib/components/ui/tabs';
	import ChangePasswordModal from '$lib/components/settings/change-password-modal.svelte';
	import { formatUserType, getUserInitials } from '$lib/stores/auth/display';
	import { merchantSession } from '$lib/stores/auth/session.svelte';
	import { cn } from '$lib/utils';
	import WebhookUrlSection from './webhook-url-section.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	merchantSession.initialize();

	const displayName = $derived(merchantSession.session?.merchantName ?? 'Partner');
	const displayOrgId = $derived(merchantSession.session?.displayOrgId ?? '');
	const userRole = $derived(formatUserType(merchantSession.session?.userType ?? 'MEMBER'));
	const sessionEmail = $derived(merchantSession.session?.email ?? '');
	const portalLabel = $derived(data.isPlatform ? 'Platform' : 'Partner');

	let changePasswordOpen = $state(false);
	let activeTab = $state('overview');

	const overviewFields = $derived([
		{ label: 'Display Name', value: displayName },
		{ label: 'Role', value: userRole },
		{ label: 'Organization ID', value: displayOrgId || '—' },
		{ label: 'Portal', value: portalLabel },
		...(sessionEmail
			? [{ label: 'Support Email', value: sessionEmail, kind: 'email' as const }]
			: [])
	]);

	$effect(() => {
		if (!data.isPlatform && activeTab === 'configuration') {
			activeTab = 'overview';
		}
	});
</script>

{#snippet overviewTab()}
	<section class="overflow-hidden rounded-xl border border-border bg-card">
		{#each overviewFields as field, index (field.label)}
			<div
				class={cn(
					'flex min-h-11 flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5',
					index < overviewFields.length - 1 && 'border-b border-border/40'
				)}
			>
				<span class="shrink-0 text-sm text-muted-foreground">{field.label}</span>
				{#if field.kind === 'email'}
					<a
						href="mailto:{field.value}"
						class="text-sm font-medium text-foreground transition-colors hover:text-primary sm:text-right"
					>
						{field.value}
					</a>
				{:else}
					<span class="text-sm font-medium text-foreground sm:text-right">{field.value}</span>
				{/if}
			</div>
		{/each}
	</section>
{/snippet}

{#snippet configurationTab()}
	<section class="overflow-hidden rounded-xl border border-border bg-card">
		<WebhookUrlSection webhookUrls={data.webhookUrls} loadError={data.webhookUrlsError} />
	</section>

	<section class="overflow-hidden rounded-xl border border-border bg-card">
		<div class="flex flex-col gap-3 px-4 py-4 sm:px-5">
			<h3 class="text-sm font-semibold text-foreground">API Credential</h3>
			<p class="text-sm text-muted-foreground">
				Generate an API credential to integrate with our APIs. This can only be done once per
				organization, so store the secret safely when it's shown.
			</p>
			<Button type="button" class="w-fit" disabled>Generate API Credential</Button>
		</div>
	</section>
{/snippet}

<div class="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 sm:px-6">
	<section class="overflow-hidden rounded-xl border border-border bg-card">
		<div class="relative h-28 bg-muted sm:h-32">
			<Button
				variant="link"
				class="absolute top-3 right-3 h-auto px-0 py-0 text-sm font-medium sm:top-4 sm:right-4"
				onclick={() => (changePasswordOpen = true)}
			>
				Change Password
				<ChevronDown class="size-4" />
			</Button>
		</div>

		<div class="relative px-4 pb-6 sm:px-6">
			<div class="absolute -top-10 left-4 sm:-top-12 sm:left-6">
				<Avatar.Root class="size-20 border-4 border-card bg-muted sm:size-24">
					<Avatar.Fallback class="bg-primary text-lg font-bold text-primary-foreground sm:text-xl">
						{getUserInitials(displayName)}
					</Avatar.Fallback>
				</Avatar.Root>
			</div>

			<div class="pt-12 sm:pt-14">
				<h2 class="text-xl font-bold text-foreground">{displayName}</h2>
				{#if displayOrgId}
					<p class="mt-0.5 text-sm text-muted-foreground">@{displayOrgId}</p>
				{/if}
				<p class="mt-0.5 text-sm text-muted-foreground">{userRole}</p>

				{#if sessionEmail}
					<ul class="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
						<li class="flex items-center gap-2 text-sm text-muted-foreground">
							<MailIcon class="size-4 shrink-0" aria-hidden="true" />
							<a
								href="mailto:{sessionEmail}"
								class="truncate text-foreground transition-colors hover:text-primary"
							>
								{sessionEmail}
							</a>
						</li>
					</ul>
				{/if}
			</div>
		</div>
	</section>

	<Tabs.Root bind:value={activeTab} class="flex w-full flex-col gap-4">
		<Tabs.List variant="line">
			<Tabs.Trigger value="overview">Overview</Tabs.Trigger>
			{#if data.isPlatform}
				<Tabs.Trigger value="configuration">Configuration</Tabs.Trigger>
			{/if}
		</Tabs.List>
		<Tabs.Content value="overview">
			{@render overviewTab()}
		</Tabs.Content>
		{#if data.isPlatform}
			<Tabs.Content value="configuration">
				{@render configurationTab()}
			</Tabs.Content>
		{/if}
	</Tabs.Root>
</div>

<ChangePasswordModal bind:open={changePasswordOpen} email={sessionEmail} />
