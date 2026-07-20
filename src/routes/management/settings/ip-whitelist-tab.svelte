<script lang="ts">
	import { onMount } from 'svelte';
	import type { ColumnDef } from '@tanstack/table-core';
	import { renderSnippet } from '$lib/components/ui/data-table';
	import { Button, EmptyState, Table, toast } from '$lib/components/reusable';
	import { Shield, Trash2, Plus } from '$lib/assets/icons';
	import { formatAbsoluteTime } from '$lib/utils/format-time';
	import { fetchIpAllowlist, type WhitelistedIp } from '$lib/api/ip-allowlist';

	let allIps = $state<WhitelistedIp[]>([]);
	let loading = $state(true);
	let loadError = $state(false);

	let searchQuery = $state('');

	const filteredIps = $derived(
		searchQuery.trim()
			? allIps.filter((ip) => ip.ipAddress.toLowerCase().includes(searchQuery.trim().toLowerCase()))
			: allIps
	);

	async function loadIps() {
		loading = true;
		loadError = false;
		try {
			allIps = await fetchIpAllowlist();
		} catch (error) {
			loadError = true;
			allIps = [];
			toast.error('Failed to load whitelisted IP addresses', {
				description: error instanceof Error ? error.message : 'Something went wrong.'
			});
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadIps();
	});

	const columns: ColumnDef<WhitelistedIp>[] = [
		{ accessorKey: 'ipAddress', header: 'IP Address', cell: (info) => info.getValue<string>() },
		{
			accessorKey: 'createdAt',
			header: 'Added On',
			cell: (info) => formatAbsoluteTime(new Date(info.getValue<string>()).getTime())
		},
		{
			id: 'actions',
			header: 'Actions',
			cell: () => renderSnippet(actionsCell, {})
		}
	];
</script>

{#snippet actionsCell()}
	<button
		type="button"
		disabled
		class="flex size-8 items-center justify-center rounded-md text-muted-foreground/40 disabled:cursor-not-allowed"
		aria-label="Delete (not yet available)"
		title="Coming soon"
	>
		<Trash2 class="size-4" />
	</button>
{/snippet}

<div class="flex flex-col gap-4">
	<section class="overflow-hidden rounded-xl border border-border bg-card">
		<div
			class="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-5"
		>
			<div class="min-w-0 flex-1">
				<h3 class="text-sm font-semibold text-foreground">Whitelisted IP Address</h3>
				<p class="mt-2 text-sm text-muted-foreground">
					Restrict API access by allowing requests only from trusted IP addresses configured for
					your organization.
				</p>
			</div>
			<Button size="sm" class="shrink-0" disabled title="Coming soon">
				<Plus class="size-4" />
				Add IP Address
			</Button>
		</div>
	</section>

	{#if loadError}
		<EmptyState
			icon={Shield}
			title="Couldn't load whitelisted IP addresses"
			description="Something went wrong while fetching the list. Please try again."
		>
			{#snippet action()}
				<Button size="sm" variant="outline" onclick={loadIps}>Retry</Button>
			{/snippet}
		</EmptyState>
	{:else if !loading && allIps.length === 0}
		<EmptyState
			icon={Shield}
			title="No Whitelisted IP Addresses"
			description="No IP addresses have been configured yet."
		>
			{#snippet action()}
				<Button size="sm" disabled title="Coming soon">
					<Plus class="size-4" />
					Add IP Address
				</Button>
			{/snippet}
		</EmptyState>
	{:else}
		<!-- <Search bind:value={searchQuery} placeholder="Search IP Address" variant="bordered" /> -->

		<div class="overflow-hidden rounded-xl border border-border bg-card">
			<Table
				data={filteredIps}
				{columns}
				pageNumber={1}
				totalPages={1}
				setPageNumber={() => {}}
				{loading}
			/>
		</div>
	{/if}

	<section
		class="flex items-start gap-3 rounded-xl border border-border bg-muted/30 px-4 py-4 sm:px-5"
	>
		<div
			class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
		>
			<Shield class="size-4" />
		</div>
		<div>
			<h3 class="text-sm font-semibold text-foreground">Security Notice</h3>
			<p class="mt-1 text-sm text-muted-foreground">
				Only requests originating from whitelisted IP addresses can access your APIs. Changes take
				effect immediately after an IP address is added or removed.
			</p>
		</div>
	</section>
</div>
