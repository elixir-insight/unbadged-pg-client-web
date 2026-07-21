<script lang="ts">
	import { onMount } from 'svelte';
	import type { ColumnDef } from '@tanstack/table-core';
	import { renderSnippet } from '$lib/components/ui/data-table';
	import { Button, EmptyState, Input, Modal, Table, toast } from '$lib/components/reusable';
	import { Shield, Trash2, Plus } from '$lib/assets/icons';
	import { formatAbsoluteTime } from '$lib/utils/format-time';
	import { isValidIpAddress } from '$lib/utils/ip-address';
	import {
		addIpToAllowlist,
		deleteIpFromAllowlist,
		fetchIpAllowlist,
		type WhitelistedIp
	} from '$lib/api/ip-allowlist';

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

	let addModalOpen = $state(false);
	let newIp = $state('');
	let ipError = $state('');
	let isSubmitting = $state(false);

	function openAddModal() {
		newIp = '';
		ipError = '';
		addModalOpen = true;
	}

	async function handleAddIp() {
		if (isSubmitting) return;

		const trimmed = newIp.trim();
		if (!trimmed) {
			ipError = 'IP address is required';
			return;
		}
		if (!isValidIpAddress(trimmed)) {
			ipError = 'Enter a valid IPv4 or IPv6 address';
			return;
		}

		isSubmitting = true;
		try {
			const message = await addIpToAllowlist(trimmed);
			toast.success(message || 'IP address added successfully');
			addModalOpen = false;
			newIp = '';
			ipError = '';
			await loadIps();
		} catch (error) {
			toast.error('Failed to add IP address', {
				description: error instanceof Error ? error.message : 'Something went wrong.'
			});
		} finally {
			isSubmitting = false;
		}
	}

	let deleteTarget = $state<WhitelistedIp | null>(null);
	let deleteModalOpen = $state(false);
	let isDeleting = $state(false);

	function requestDelete(ip: WhitelistedIp) {
		deleteTarget = ip;
		deleteModalOpen = true;
	}

	async function confirmDelete() {
		if (isDeleting || !deleteTarget) return;

		isDeleting = true;
		try {
			const message = await deleteIpFromAllowlist(deleteTarget.id);
			toast.success(message || 'IP allowlist deleted successfully');
			deleteModalOpen = false;
			deleteTarget = null;
			await loadIps();
		} catch (error) {
			toast.error('Failed to delete IP address', {
				description: error instanceof Error ? error.message : 'Something went wrong.'
			});
		} finally {
			isDeleting = false;
		}
	}

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
			cell: (info) => renderSnippet(actionsCell, { row: info.row.original })
		}
	];
</script>

{#snippet actionsCell({ row }: { row: WhitelistedIp })}
	<button
		type="button"
		onclick={() => requestDelete(row)}
		class="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
		aria-label="Delete {row.ipAddress}"
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
			<Button size="sm" class="shrink-0" onclick={openAddModal}>
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
				<Button size="sm" onclick={openAddModal}>
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

<Modal
	bind:open={addModalOpen}
	title="Add IP Address"
	description="Allow requests only from trusted IP addresses by adding them to your organization's allowlist."
>
	<div class="flex flex-col gap-1.5">
		<label for="new-ip" class="text-sm font-medium text-foreground">
			IP Address <span class="text-destructive">*</span>
		</label>
		<Input
			id="new-ip"
			bind:value={newIp}
			placeholder="Enter IP Address"
			oninput={() => (ipError = '')}
			onkeydown={(e) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					handleAddIp();
				}
			}}
		/>
		{#if ipError}
			<p class="text-xs text-destructive">{ipError}</p>
		{:else}
			<p class="text-xs text-muted-foreground">Example: 192.168.1.10</p>
		{/if}
	</div>

	{#snippet footer()}
		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<Button
				variant="outline"
				class="w-full sm:w-auto"
				disabled={isSubmitting}
				onclick={() => (addModalOpen = false)}
			>
				Cancel
			</Button>
			<Button class="w-full sm:w-auto" disabled={isSubmitting} onclick={handleAddIp}>
				{isSubmitting ? 'Adding…' : 'Add IP Address'}
			</Button>
		</div>
	{/snippet}
</Modal>

<Modal
	bind:open={deleteModalOpen}
	title="Delete IP Address"
	description="Are you sure you want to remove this IP address from the allowlist? This action will immediately revoke API access from this IP address."
>
	{#snippet footer()}
		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<Button
				variant="outline"
				class="w-full sm:w-auto"
				disabled={isDeleting}
				onclick={() => (deleteModalOpen = false)}
			>
				Cancel
			</Button>
			<Button
				variant="destructive"
				class="w-full sm:w-auto"
				disabled={isDeleting}
				onclick={confirmDelete}
			>
				{isDeleting ? 'Deleting…' : 'Delete'}
			</Button>
		</div>
	{/snippet}
</Modal>
