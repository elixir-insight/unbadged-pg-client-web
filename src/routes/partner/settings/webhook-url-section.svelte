<script lang="ts">
	import { invalidateAll, replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { ColumnDef } from '@tanstack/table-core';
	import { Button, Table } from '$lib/components/reusable';
	import { renderComponent } from '$lib/components/ui/data-table';
	import * as Select from '$lib/components/ui/select';
	import { formatAbsoluteTime } from '$lib/utils/format-time';
	import AddWebhookModal from './add-webhook-modal.svelte';
	import WebhookEditCell from './webhook-edit-cell.svelte';
	import WebhookStatusBadge from './webhook-status-badge.svelte';
	import WebhookUrlCell from './webhook-url-cell.svelte';
	import type { WebhookUrlRow } from './webhook-logic';

	interface Props {
		webhookUrls: WebhookUrlRow[];
		loadError?: string | null;
	}

	let { webhookUrls, loadError = null }: Props = $props();

	const pageSize = 5;
	const eventTypeFilters = ['ALL', 'PAYIN', 'PAYOUT'] as const;
	type EventTypeFilter = (typeof eventTypeFilters)[number];

	function getInitialEventTypeFilter(): EventTypeFilter {
		const eventType = page.url.searchParams.get('eventType')?.toUpperCase();
		return eventTypeFilters.includes(eventType as EventTypeFilter)
			? (eventType as EventTypeFilter)
			: 'ALL';
	}

	function getInitialPageNumber(): number {
		const parsedPage = Number(page.url.searchParams.get('page'));
		return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
	}

	let addOpen = $state(false);
	let selectedWebhook = $state<WebhookUrlRow | null>(null);
	let selectedEventType = $state<EventTypeFilter>(getInitialEventTypeFilter());
	let pageNumber = $state(getInitialPageNumber());

	const filteredWebhookUrls = $derived(
		selectedEventType === 'ALL'
			? webhookUrls
			: webhookUrls.filter((webhook) => webhook.eventType.toUpperCase() === selectedEventType)
	);
	const totalPages = $derived(Math.max(1, Math.ceil(filteredWebhookUrls.length / pageSize)));
	const paginatedWebhookUrls = $derived(
		filteredWebhookUrls.slice((pageNumber - 1) * pageSize, pageNumber * pageSize)
	);

	$effect(() => {
		if (pageNumber > totalPages) pageNumber = totalPages;
	});

	$effect(() => {
		const eventType = selectedEventType;
		const currentPage = pageNumber;
		const url = new URL(page.url);

		if (eventType === 'ALL') url.searchParams.delete('eventType');
		else url.searchParams.set('eventType', eventType);

		if (currentPage === 1) url.searchParams.delete('page');
		else url.searchParams.set('page', String(currentPage));

		if (url.search !== page.url.search) {
			const nextUrl = `${resolve('/partner/settings')}${url.search}${url.hash}`;
			try {
				// The pathname is resolved in the argument; the rule cannot follow the appended query string.
				// eslint-disable-next-line svelte/no-navigation-without-resolve
				replaceState(nextUrl, page.state);
			} catch {
				// Isolated component tests render without the SvelteKit router.
				window.history.replaceState(window.history.state, '', nextUrl);
			}
		}
	});

	function setEventTypeFilter(eventType: EventTypeFilter) {
		selectedEventType = eventType;
		pageNumber = 1;
	}

	function openAddModal() {
		selectedWebhook = null;
		addOpen = true;
	}

	function openEditModal(webhook: WebhookUrlRow) {
		selectedWebhook = webhook;
		addOpen = true;
	}

	const columns: ColumnDef<WebhookUrlRow>[] = [
		{ accessorKey: 'eventType', header: 'Event Type' },
		{
			accessorKey: 'webhookUrl',
			header: 'Webhook URL',
			cell: (info) => renderComponent(WebhookUrlCell, { url: info.getValue<string>() })
		},
		{
			accessorKey: 'isActive',
			header: 'Status',
			cell: (info) => renderComponent(WebhookStatusBadge, { isActive: info.getValue<boolean>() })
		},
		{
			accessorKey: 'createdAt',
			header: 'Created',
			cell: (info) => formatAbsoluteTime(new Date(info.getValue<string>()).getTime())
		},
		{
			id: 'actions',
			header: 'Actions',
			cell: (info) =>
				renderComponent(WebhookEditCell, {
					webhook: info.row.original,
					onedit: openEditModal
				})
		}
	];
</script>

<div class="flex flex-col gap-3 border-t border-border/40 px-4 py-4 sm:px-5">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h3 class="text-sm font-semibold text-foreground">Webhook URLs</h3>
		<div class="flex items-center gap-2">
			<label for="webhook-event-filter" class="text-sm text-muted-foreground">Event Type</label>
			<Select.Root type="single" bind:value={() => selectedEventType, setEventTypeFilter}>
				<Select.Trigger id="webhook-event-filter" class="w-28" aria-label="Filter by event type">
					{selectedEventType}
				</Select.Trigger>
				<Select.Content>
					{#each eventTypeFilters as eventTypeFilter (eventTypeFilter)}
						<Select.Item value={eventTypeFilter} label={eventTypeFilter}>
							{eventTypeFilter}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
			<Button size="sm" class="shrink-0" onclick={openAddModal}>Add Webhook</Button>
		</div>
	</div>

	{#if loadError}
		<p class="text-sm text-destructive" role="alert">{loadError}</p>
		<Button variant="outline" size="sm" class="w-fit" onclick={() => invalidateAll()}>Retry</Button>
	{:else if webhookUrls.length === 0}
		<p class="text-sm text-muted-foreground">No webhooks configured yet.</p>
	{:else}
		<Table
			data={paginatedWebhookUrls}
			{columns}
			{pageNumber}
			{totalPages}
			setPageNumber={(nextPage) => (pageNumber = nextPage)}
		/>
	{/if}
</div>

<AddWebhookModal bind:open={addOpen} webhook={selectedWebhook} />
