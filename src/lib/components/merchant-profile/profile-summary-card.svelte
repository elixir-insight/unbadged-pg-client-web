<script lang="ts">
	import { Avatar, Chip } from '$lib/components/reusable';
	import { Calendar, RefreshCw, ActivityIcon, Hash } from '$lib/assets/icons';
	import { statusVariant, statusLabel, type MerchantProfileData } from './mock-data';

	let { profile }: { profile: MerchantProfileData } = $props();

	const stats = $derived([
		{ icon: Calendar, label: 'Member Since', value: profile.memberSince },
		{ icon: RefreshCw, label: 'Last Updated', value: profile.lastUpdated },
		{ icon: ActivityIcon, label: 'Last Login', value: profile.lastLogin }
	]);
</script>

<div class="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
	<div class="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
		<!-- Left: identity -->
		<div class="flex items-center gap-4">
			<Avatar name={profile.merchantName} size="lg" shape="circle" />
			<div class="flex flex-col gap-1">
				<div class="flex flex-wrap items-center gap-2">
					<p class="text-xl font-semibold text-foreground">{profile.merchantName}</p>
					<Chip variant={statusVariant(profile.status)}>{statusLabel(profile.status)}</Chip>
				</div>
				<p class="text-sm text-muted-foreground">{profile.organizationName}</p>
				<div class="flex items-center gap-1 text-xs text-muted-foreground/70">
					<Hash class="size-3" />
					<span class="font-mono">{profile.merchantId}</span>
				</div>
			</div>
		</div>

		<!-- Right: summary stats -->
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto lg:min-w-100">
			{#each stats as stat (stat.label)}
				<div class="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
					<div
						class="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
					>
						<stat.icon class="size-4" />
					</div>
					<div class="min-w-0">
						<p class="truncate text-xs text-muted-foreground">{stat.label}</p>
						<p class="truncate text-sm font-semibold text-foreground">{stat.value}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
