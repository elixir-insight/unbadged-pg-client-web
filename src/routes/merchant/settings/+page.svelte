<script lang="ts">
	import { ChevronDown, Globe, MailIcon, PhoneIcon } from '$lib/assets/icons';
	import { Button, Chip, Tabs } from '$lib/components/reusable';
	import type { TabItem } from '$lib/components/reusable';
	import * as Avatar from '$lib/components/ui/avatar';
	import { cn } from '$lib/utils';
	import { merchantSession } from '$lib/stores/auth/session.svelte';
	import ChangePasswordModal from '$lib/components/settings/change-password-modal.svelte';

	merchantSession.initialize();

	const merchantName = $derived(merchantSession.session?.merchantName ?? 'Merchant');
	const organizationId = $derived(merchantSession.session?.organizationId ?? '');
	const website = 'https://google.com';
	const email = 'merchant@jubiliantpay.com';
	const phone = '+916382303714';
	const sessionEmail = $derived(merchantSession.session?.email ?? email);

	let changePasswordOpen = $state(false);

	const overviewFields = [
		{ label: 'Company Name', value: 'wayne' },
		{ label: 'Business Type', value: 'Private Limited' },
		{ label: 'Country', value: 'India' },
		{ label: 'Registered State', value: 'Tamil Nadu' },
		{ label: 'Support Email', value: 'merchant@wayne.com', kind: 'email' as const },
		{ label: 'Phone', value: '+91 XXXXX XXXXX' }
	];

	let activeTab = $state('overview');

	const tabs: TabItem[] = [
		{
			value: 'overview',
			label: 'Overview',
			content: overviewTab
		},
		{
			value: 'configuration',
			label: 'Configuration',
			content: configurationTab
		}
	];

	function initials(name: string) {
		return name
			.split(' ')
			.map((word) => word[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}
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
		<div
			class="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-5"
		>
			<div class="min-w-0 flex-1">
				<h3 class="text-sm font-semibold text-foreground">Webhook</h3>
				<p class="mt-2 truncate text-sm text-muted-foreground">https://merchant.com/webhook</p>
			</div>
			<Chip variant="success">Configured</Chip>
		</div>

		<div class="border-t border-border/40 px-4 py-4 sm:px-5">
			<h3 class="text-sm font-semibold text-foreground">API Keys</h3>
			<p class="mt-2 font-mono text-sm tracking-widest text-muted-foreground">••••••••••••••••</p>
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
						{initials(merchantName)}
					</Avatar.Fallback>
				</Avatar.Root>
			</div>

			<div class="pt-12 sm:pt-14">
				<h2 class="text-xl font-bold text-foreground">{merchantName}</h2>
				{#if organizationId}
					<p class="mt-0.5 text-sm text-muted-foreground">@{organizationId}</p>
				{/if}

				<ul class="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
					<li class="flex items-center gap-2 text-sm text-muted-foreground">
						<Globe class="size-4 shrink-0" aria-hidden="true" />
						<a
							href={website}
							target="_blank"
							rel="noopener noreferrer"
							class="truncate text-foreground transition-colors hover:text-primary"
						>
							{website}
						</a>
					</li>
					<li class="flex items-center gap-2 text-sm text-muted-foreground">
						<MailIcon class="size-4 shrink-0" aria-hidden="true" />
						<a
							href="mailto:{email}"
							class="truncate text-foreground transition-colors hover:text-primary"
						>
							{email}
						</a>
					</li>
					<li class="flex items-center gap-2 text-sm text-muted-foreground">
						<PhoneIcon class="size-4 shrink-0" aria-hidden="true" />
						<a
							href="tel:{phone}"
							class="truncate text-foreground transition-colors hover:text-primary"
						>
							{phone}
						</a>
					</li>
				</ul>
			</div>
		</div>
	</section>

	<Tabs {tabs} bind:value={activeTab} variant="line" class="flex w-full flex-col gap-4" />
</div>

<ChangePasswordModal bind:open={changePasswordOpen} email={sessionEmail} />
