<script lang="ts">
	import type { DateRange } from 'bits-ui';
	import { getLocalTimeZone, today } from '@internationalized/date';
	import type { DropdownOption } from '$lib/components/reusable';
	import { Button, DateRangePicker, Dropdown, toast } from '$lib/components/reusable';
	import { AlertCircle, Loader2 } from '$lib/assets/icons';
	import { cn } from '$lib/utils';
	import FormatSegmentedControl from './format-segmented-control.svelte';
	import ReportFormField from './report-form-field.svelte';
	import ReportInfoBanner from './report-info-banner.svelte';
	import {
		getReportTypeOptions,
		getVisibleFilters,
		PAYMENT_METHOD_OPTIONS,
		SERVICE_OPTIONS,
		SETTLEMENT_STATUS_OPTIONS,
		TRANSACTION_STATUS_OPTIONS
	} from './constants';
	import { generateAndDownloadReport } from './generate-report';
	import type { ReportFileFormat, ReportFilters, ReportPortal, ReportType } from './types';
	import { validateReportForm } from './validation';

	interface Props {
		portal: ReportPortal;
		organizationOptions?: DropdownOption[];
		merchantOptions?: DropdownOption[];
		class?: string;
	}

	let {
		portal,
		organizationOptions = [],
		merchantOptions = [],
		class: className
	}: Props = $props();

	function createDefaultDateRange(): DateRange {
		const tz = getLocalTimeZone();
		const end = today(tz);
		const start = end.subtract({ days: 29 });
		return { start, end };
	}

	let reportType = $state<ReportType | undefined>(undefined);
	let dateRange = $state<DateRange>(createDefaultDateRange());
	let fileFormat = $state<ReportFileFormat>('csv');
	let filters = $state<ReportFilters>({});
	let isGenerating = $state(false);
	let errorMessage = $state<string | null>(null);

	const reportTypeOptions = $derived(getReportTypeOptions(portal));
	const visibleFilters = $derived(getVisibleFilters(portal, reportType));
	const inputsDisabled = $derived(isGenerating);

	const filteredMerchantOptions = $derived.by(() => {
		if (!filters.organizationId) return merchantOptions;
		return merchantOptions.filter((option) => option.value === filters.organizationId);
	});

	$effect(() => {
		if (
			filters.merchantId &&
			!filteredMerchantOptions.some((option) => option.value === filters.merchantId)
		) {
			filters = { ...filters, merchantId: undefined };
		}
	});

	function updateFilter<K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) {
		if (key === 'organizationId') {
			filters = { ...filters, organizationId: value, merchantId: undefined };
			return;
		}
		filters = { ...filters, [key]: value };
	}

	async function handleGenerate() {
		errorMessage = null;

		const validation = validateReportForm({ reportType, dateRange, fileFormat });
		if (!validation.valid) {
			errorMessage = validation.error ?? 'Please check your inputs and try again.';
			return;
		}

		isGenerating = true;

		try {
			await generateAndDownloadReport({
				portal,
				reportType: reportType!,
				dateRange,
				fileFormat,
				filters
			});
			toast.success('Report downloaded successfully.');
		} catch {
			errorMessage = 'Unable to generate the report. Please try again.';
		} finally {
			isGenerating = false;
		}
	}
</script>

<div class={cn('flex flex-col gap-6', className)}>
	<header class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold tracking-tight text-foreground">Generate Report</h1>
		<p class="text-sm text-muted-foreground">
			Generate and download transaction reports for a selected date range.
		</p>
	</header>

	<div class="rounded-xl border border-border bg-card p-6 shadow-xs">
		<fieldset class="flex flex-col gap-6 lg:max-w-xl" disabled={inputsDisabled}>
			<ReportFormField label="Report Type">
				<Dropdown
					bind:value={reportType}
					options={reportTypeOptions}
					placeholder="Select report"
					bordered={true}
					required
				/>
			</ReportFormField>

			<ReportFormField label="Date Range">
				<DateRangePicker bind:value={dateRange} />
			</ReportFormField>

			<ReportFormField label="File Format">
				<FormatSegmentedControl bind:value={fileFormat} disabled={inputsDisabled} />
			</ReportFormField>

			{#if visibleFilters.length > 0}
				<div class="flex flex-col gap-6 border-t border-border pt-6">
					{#if visibleFilters.includes('organization')}
						<ReportFormField label="Organization">
							<Dropdown
								value={filters.organizationId}
								options={organizationOptions}
								placeholder="Select organization"
								bordered={true}
								search={true}
								onValueChange={(value) => updateFilter('organizationId', value)}
							/>
						</ReportFormField>
					{/if}

					{#if visibleFilters.includes('merchant')}
						<ReportFormField label="Merchant">
							<Dropdown
								value={filters.merchantId}
								options={filteredMerchantOptions}
								placeholder="Select merchant"
								bordered={true}
								search={true}
								disabled={visibleFilters.includes('organization') && !filters.organizationId}
								onValueChange={(value) => updateFilter('merchantId', value)}
							/>
						</ReportFormField>
					{/if}

					{#if visibleFilters.includes('service')}
						<ReportFormField label="Service">
							<Dropdown
								value={filters.service}
								options={SERVICE_OPTIONS}
								placeholder="Select service"
								bordered={true}
								onValueChange={(value) => updateFilter('service', value)}
							/>
						</ReportFormField>
					{/if}

					{#if visibleFilters.includes('transactionStatus')}
						<ReportFormField label="Transaction Status">
							<Dropdown
								value={filters.transactionStatus}
								options={TRANSACTION_STATUS_OPTIONS}
								placeholder="Select status"
								bordered={true}
								onValueChange={(value) => updateFilter('transactionStatus', value)}
							/>
						</ReportFormField>
					{/if}

					{#if visibleFilters.includes('paymentMethod')}
						<ReportFormField label="Payment Method">
							<Dropdown
								value={filters.paymentMethod}
								options={PAYMENT_METHOD_OPTIONS}
								placeholder="Select payment method"
								bordered={true}
								onValueChange={(value) => updateFilter('paymentMethod', value)}
							/>
						</ReportFormField>
					{/if}

					{#if visibleFilters.includes('settlementStatus')}
						<ReportFormField label="Settlement Status">
							<Dropdown
								value={filters.settlementStatus}
								options={SETTLEMENT_STATUS_OPTIONS}
								placeholder="Select settlement status"
								bordered={true}
								onValueChange={(value) => updateFilter('settlementStatus', value)}
							/>
						</ReportFormField>
					{/if}
				</div>
			{/if}

			<ReportInfoBanner />

			{#if errorMessage}
				<div
					class="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3"
					role="alert"
				>
					<AlertCircle class="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
					<p class="text-sm text-destructive">{errorMessage}</p>
				</div>
			{/if}
		</fieldset>

		<div class="mt-6 flex justify-end border-t border-border pt-6">
			<Button disabled={isGenerating} onclick={handleGenerate}>
				{#if isGenerating}
					<Loader2 class="size-4 animate-spin" aria-hidden="true" />
					Generating...
				{:else}
					Generate Report
				{/if}
			</Button>
		</div>
	</div>
</div>
