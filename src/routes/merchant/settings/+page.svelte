<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { ChevronDown, Globe, MailIcon, PhoneIcon } from '$lib/assets/icons';
	import { Button, Chip } from '$lib/components/reusable';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Tabs from '$lib/components/ui/tabs';
	import ChangePasswordModal from '$lib/components/settings/change-password-modal.svelte';
	import IpWhitelistTab from '$lib/components/settings/ip-whitelist-tab.svelte';
	import MfaSection from '$lib/components/settings/mfa-section.svelte';
	import { getUserInitials } from '$lib/stores/auth/display';
	import { merchantSession } from '$lib/stores/auth/session.svelte';
	import { cn } from '$lib/utils';
	import ApiCredentialSection from './api-credential-section.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	merchantSession.initialize();

	const profile = $derived(data.profile);
	const displayName = $derived(
		profile?.displayName ?? merchantSession.session?.merchantName ?? 'Merchant'
	);
	const organizationId = $derived(profile?.orgId ?? merchantSession.session?.organizationId ?? '');
	const website = $derived(profile?.website ?? '');
	const email = $derived(profile?.email ?? merchantSession.session?.email ?? '');
	const phone = $derived(profile?.phone ?? '');
	const sessionEmail = $derived(email || merchantSession.session?.email || '');

	let changePasswordOpen = $state(false);

	const overviewFields = $derived(
		profile
			? [
					{ label: 'Company Name', value: profile.companyName },
					{ label: 'Business Type', value: profile.businessType },
					{ label: 'Country', value: profile.country },
					{ label: 'Registered Date', value: profile.registeredDate },
					...(profile.email
						? [{ label: 'Support Email', value: profile.email, kind: 'email' as const }]
						: []),
					...(profile.phone ? [{ label: 'Phone', value: profile.phone }] : [])
				]
			: []
	);

	let activeTab = $state('overview');
</script>

{#snippet overviewTab()}
	{#if data.profileError}
		<section class="overflow-hidden rounded-xl border border-border bg-card">
			<div class="flex flex-col gap-3 px-4 py-4 sm:px-5">
				<p class="text-sm text-destructive" role="alert">{data.profileError}</p>
				<Button variant="outline" size="sm" class="w-fit" onclick={() => invalidateAll()}
					>Retry</Button
				>
			</div>
		</section>
	{:else}
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
	{/if}
{/snippet}

{#snippet configurationTab()}
	<section class="overflow-hidden rounded-xl border border-border bg-card">
		<div
			class="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-5"
		>
			<div class="min-w-0 flex-1">
				<h3 class="text-sm font-semibold text-foreground">Webhook</h3>
				<p class="mt-2 text-sm text-muted-foreground">No webhook configured yet.</p>
			</div>
			<Chip variant="secondary">Not configured</Chip>
		</div>

		<ApiCredentialSection credential={data.apiCredential} loadError={data.apiCredentialError} />
	</section>
{/snippet}

{#snippet ipWhitelistTab()}
	<IpWhitelistTab portal="merchant" />
{/snippet}

{#snippet mfaTab()}
	<MfaSection mfaConfig={data.mfaConfig} mfaError={data.mfaError} />
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
				{#if organizationId}
					<p class="mt-0.5 text-sm text-muted-foreground">@{organizationId}</p>
				{/if}

				{#if website || email || phone}
					<ul class="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
						{#if website}
							<li class="flex items-center gap-2 text-sm text-muted-foreground">
								<Globe class="size-4 shrink-0" aria-hidden="true" />
								<a
									href={website}
									target="_blank"
									rel="external noopener noreferrer"
									class="truncate text-foreground transition-colors hover:text-primary"
								>
									{website}
								</a>
							</li>
						{/if}
						{#if email}
							<li class="flex items-center gap-2 text-sm text-muted-foreground">
								<MailIcon class="size-4 shrink-0" aria-hidden="true" />
								<a
									href="mailto:{email}"
									class="truncate text-foreground transition-colors hover:text-primary"
								>
									{email}
								</a>
							</li>
						{/if}
						{#if phone}
							<li class="flex items-center gap-2 text-sm text-muted-foreground">
								<PhoneIcon class="size-4 shrink-0" aria-hidden="true" />
								<a
									href="tel:{phone}"
									class="truncate text-foreground transition-colors hover:text-primary"
								>
									{phone}
								</a>
							</li>
						{/if}
					</ul>
				{/if}
			</div>
		</div>
	</section>

	<Tabs.Root bind:value={activeTab} class="flex w-full flex-col gap-4">
		<Tabs.List variant="line">
			<Tabs.Trigger value="overview">Overview</Tabs.Trigger>
			<Tabs.Trigger value="configuration">Configuration</Tabs.Trigger>
			<Tabs.Trigger value="ip-whitelist">Whitelisted IP Address</Tabs.Trigger>
			<Tabs.Trigger value="mfa">MFA</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="overview">
			{@render overviewTab()}
		</Tabs.Content>
		<Tabs.Content value="configuration">
			{@render configurationTab()}
		</Tabs.Content>
		<Tabs.Content value="ip-whitelist">
			{@render ipWhitelistTab()}
		</Tabs.Content>
		<Tabs.Content value="mfa">
			{@render mfaTab()}
		</Tabs.Content>
	</Tabs.Root>
</div>

<ChangePasswordModal bind:open={changePasswordOpen} email={sessionEmail} />
