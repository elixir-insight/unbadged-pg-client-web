<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import { renderSnippet } from '$lib/components/ui/data-table';
	import { Button, Input, Modal, Search, Table, toast } from '$lib/components/reusable';
	import { Shield, Trash2, Plus } from '$lib/assets/icons';

	interface WhitelistedIp extends Record<string, unknown> {
		id: string;
		ipAddress: string;
	}

	let allIps = $state<WhitelistedIp[]>([
		{ id: 'ip-1', ipAddress: '203.0.113.10' },
		{ id: 'ip-2', ipAddress: '103.24.15.20' },
		{ id: 'ip-3', ipAddress: '49.206.22.14' },
		{ id: 'ip-4', ipAddress: '157.245.80.17' }
	]);

	let searchQuery = $state('');
	let pageNumber = $state(1);
	const pageSize = 10;

	const filteredIps = $derived(
		searchQuery.trim()
			? allIps.filter((ip) => ip.ipAddress.toLowerCase().includes(searchQuery.trim().toLowerCase()))
			: allIps
	);
	const totalPages = $derived(Math.max(1, Math.ceil(filteredIps.length / pageSize)));
	const pagedIps = $derived(filteredIps.slice((pageNumber - 1) * pageSize, pageNumber * pageSize));

	function onSearchInput() {
		pageNumber = 1;
	}

	function isValidIPv4(value: string): boolean {
		const parts = value.split('.');
		if (parts.length !== 4) return false;
		return parts.every(
			(part) => /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255
		);
	}

	function isValidIPv6(value: string): boolean {
		const ipv6Pattern =
			/^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
		return ipv6Pattern.test(value);
	}

	let addModalOpen = $state(false);
	let newIp = $state('');
	let ipError = $state('');
	let isSubmitting = $state(false);

	function openAddModal() {
		newIp = '';
		ipError = '';
		addModalOpen = true;
	}

	function handleAddIp() {
		const trimmed = newIp.trim();
		if (isSubmitting) return;
		if (!trimmed) {
			ipError = 'IP address is required';
			return;
		}
		if (!isValidIPv4(trimmed) && !isValidIPv6(trimmed)) {
			ipError = 'Enter a valid IPv4 or IPv6 address';
			return;
		}
		if (allIps.some((ip) => ip.ipAddress.toLowerCase() === trimmed.toLowerCase())) {
			ipError = 'This IP address is already whitelisted';
			return;
		}

		isSubmitting = true;
		allIps = [{ id: `ip-${crypto.randomUUID().slice(0, 8)}`, ipAddress: trimmed }, ...allIps];
		isSubmitting = false;
		addModalOpen = false;
		toast.success('IP address added successfully');
	}

	let deleteTargetId = $state<string | null>(null);
	let deleteModalOpen = $state(false);

	function requestDelete(id: string) {
		deleteTargetId = id;
		deleteModalOpen = true;
	}

	function confirmDelete() {
		allIps = allIps.filter((ip) => ip.id !== deleteTargetId);
		deleteModalOpen = false;
		toast.success('IP address removed successfully');
	}

	const columns: ColumnDef<WhitelistedIp>[] = [
		{ accessorKey: 'ipAddress', header: 'IP Address', cell: (info) => info.getValue<string>() },
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
		onclick={() => requestDelete(row.id)}
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
					Only requests originating from the IP addresses listed below are permitted to access your
					Payment Gateway APIs.
				</p>
			</div>
			<Button size="sm" class="shrink-0" onclick={openAddModal}>
				<Plus class="size-4" />
				Add IP Address
			</Button>
		</div>
	</section>

	{#if allIps.length === 0}
		<section
			class="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center"
		>
			<div
				class="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
			>
				<Shield class="size-6" />
			</div>
			<div>
				<h3 class="text-sm font-semibold text-foreground">No Whitelisted IP Addresses</h3>
				<p class="mt-1 text-sm text-muted-foreground">
					No IP addresses have been configured yet.<br />
					Add trusted IP addresses to restrict API access.
				</p>
			</div>
			<Button size="sm" onclick={openAddModal}>
				<Plus class="size-4" />
				Add IP Address
			</Button>
		</section>
	{:else}
		<Search
			bind:value={searchQuery}
			oninput={onSearchInput}
			placeholder="Search IP Address"
			variant="bordered"
		/>

		<div class="overflow-hidden rounded-xl border border-border bg-card">
			<Table
				data={pagedIps}
				{columns}
				{pageNumber}
				{totalPages}
				setPageNumber={(p) => (pageNumber = p)}
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

<Modal bind:open={addModalOpen} title="Add IP Address">
	<div class="flex flex-col gap-1.5">
		<label for="new-ip" class="text-sm font-medium text-foreground">
			IP Address <span class="text-destructive">*</span>
		</label>
		<Input
			id="new-ip"
			bind:value={newIp}
			placeholder="Enter IPv4 or IPv6 Address"
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
			<p class="text-xs text-muted-foreground">Example: 203.0.113.10</p>
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
	title="Remove IP Address"
	description="Are you sure you want to remove this IP address? Removing this IP immediately revokes API access from that address."
>
	{#snippet footer()}
		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<Button variant="outline" class="w-full sm:w-auto" onclick={() => (deleteModalOpen = false)}>
				Cancel
			</Button>
			<Button variant="destructive" class="w-full sm:w-auto" onclick={confirmDelete}>Remove</Button>
		</div>
	{/snippet}
</Modal>
