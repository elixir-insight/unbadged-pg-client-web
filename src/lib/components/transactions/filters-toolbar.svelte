<script lang="ts">
	import { Chip, Dropdown, RangeCalendar, SearchField } from '$lib/components/reusable';
	import type { DropdownOption, SearchFieldOption } from '$lib/components/reusable';
	import type { Merchant } from '$lib/data/refunds-mock';
	import type { TransactionStatus, TransactionType } from '$lib/data/payin-transactions-mock';
	import { statusLabel } from './status';
	import { X, AlertCircle } from '$lib/assets/icons';
	import { CalendarDate } from '@internationalized/date';
	import type { DateRange } from 'bits-ui';

	interface Props {
		merchants: Merchant[];
		merchantId: string;
		onMerchantChange: (id: string) => void;
		type: TransactionType | '';
		onTypeChange: (value: string) => void;
		status: TransactionStatus | '';
		onStatusChange: (value: string) => void;
		from: string;
		to: string;
		onDateApply: (from: string | null, to: string | null) => void;
		dateInvalid: boolean;
		searchField: string;
		searchValue: string;
		onSearch: (field: string, value: string) => void;
		onReset: () => void;
	}

	let {
		merchants,
		merchantId,
		onMerchantChange,
		type,
		onTypeChange,
		status,
		onStatusChange,
		from,
		to,
		onDateApply,
		dateInvalid,
		searchField = $bindable(),
		searchValue = $bindable(),
		onSearch,
		onReset
	}: Props = $props();

	const merchantOptions = $derived<DropdownOption[]>(
		merchants.map((m) => ({ value: m.id, label: m.name }))
	);
	const typeOptions: DropdownOption[] = [
		{ value: 'UPI', label: 'UPI' },
		{ value: 'Net Banking', label: 'Net Banking' },
		{ value: 'Bank Transfer', label: 'Bank Transfer' }
	];
	const statusOptions: DropdownOption[] = (
		['success', 'pending', 'failed', 'refunded', 'disputed', 'chargeback'] as TransactionStatus[]
	).map((s) => ({ value: s, label: statusLabel(s) }));
	const searchFieldOptions: SearchFieldOption[] = [
		{ value: 'crn', label: 'CRN', placeholder: 'Enter CRN...' },
		{ value: 'clientOrderId', label: 'Client Order ID', placeholder: 'Enter Client Order ID...' },
		{ value: 'utr', label: 'UTR', placeholder: 'Enter UTR...' }
	];

	function parseDate(s: string): CalendarDate | undefined {
		if (!s) return undefined;
		const [y, m, d] = s.split('-').map(Number);
		return y && m && d ? new CalendarDate(y, m, d) : undefined;
	}

	const rangeValue = $derived<DateRange>({ start: parseDate(from), end: parseDate(to) });

	function formatDisplay(s: string): string {
		if (!s) return '';
		const [, m, d] = s.split('-').map(Number);
		const months = [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec'
		];
		return `${String(d).padStart(2, '0')} ${months[m - 1]}`;
	}

	const activeFilters = $derived([
		...(from || to
			? [
					{
						key: 'date',
						label: 'Date',
						value:
							from && to
								? `${formatDisplay(from)} – ${formatDisplay(to)}`
								: from
									? `From ${formatDisplay(from)}`
									: `To ${formatDisplay(to)}`
					}
				]
			: []),
		...(type ? [{ key: 'type', label: 'Type', value: type }] : []),
		...(status ? [{ key: 'status', label: 'Status', value: statusLabel(status) }] : [])
	]);

	function removeFilter(key: string) {
		if (key === 'date') onDateApply(null, null);
		else if (key === 'type') onTypeChange('');
		else if (key === 'status') onStatusChange('');
	}
</script>

<div class="flex flex-col gap-3">
	<div class="flex flex-wrap items-center gap-2.5">
		<Dropdown
			value={merchantId || undefined}
			options={merchantOptions}
			placeholder="Merchant"
			size="sm"
			bordered
			class="w-52"
			onValueChange={onMerchantChange}
		/>
		<Dropdown
			value={type || undefined}
			options={typeOptions}
			placeholder="Transaction Type"
			size="sm"
			bordered
			class="w-44"
			onValueChange={onTypeChange}
		/>
		<Dropdown
			value={status || undefined}
			options={statusOptions}
			placeholder="Status"
			size="sm"
			bordered
			class="w-36"
			onValueChange={onStatusChange}
		/>

		<div class="flex flex-col gap-1">
			<RangeCalendar
				value={rangeValue}
				onApply={(range) =>
					onDateApply(range.start?.toString() ?? null, range.end?.toString() ?? null)}
			/>
			{#if dateInvalid}
				<p class="flex items-center gap-1 text-xs text-destructive">
					<AlertCircle class="size-3" /> From date must be on or before To date
				</p>
			{/if}
		</div>

		<div class="flex-1"></div>

		<SearchField
			fields={searchFieldOptions}
			bind:field={searchField}
			bind:value={searchValue}
			{onSearch}
			class="min-w-72"
		/>
	</div>

	{#if activeFilters.length > 0}
		<div class="flex flex-wrap items-center gap-2">
			{#each activeFilters as filter (filter.key)}
				<Chip variant="outline" class="h-auto gap-0 py-1 pl-3 pr-2">
					<span class="text-xs text-muted-foreground">{filter.label}:&nbsp;</span>
					<span class="text-xs font-medium text-foreground">{filter.value}</span>
					<button
						type="button"
						onclick={() => removeFilter(filter.key)}
						class="ml-1.5 cursor-pointer rounded-sm text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none"
						aria-label="Remove {filter.label} filter"
					>
						<X class="size-3" />
					</button>
				</Chip>
			{/each}
			<button
				type="button"
				onclick={onReset}
				class="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
			>
				Clear All
			</button>
		</div>
	{/if}
</div>
