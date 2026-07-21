<script lang="ts">
	import { resolve } from '$app/paths';
	import SearchWithDropdown from '$lib/components/reusable/search-with-dropdown/SearchWithDropdown.svelte';
	import StatusStatCard from '$lib/components/reusable/status-stat-card/StatusStatCard.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Chip } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import { processBulkBatch, uploadBulkCsv, CheckStatusApiError } from '$lib/api/check-status';
	import {
		SEARCH_BY_OPTIONS,
		searchByLabel,
		type BulkResult,
		type BulkValidation,
		type SearchByType
	} from '$lib/types/check-status';
	import { cn } from '$lib/utils';
	import CircleCheckBig from '@lucide/svelte/icons/circle-check-big';
	import Download from '@lucide/svelte/icons/download';
	import FileText from '@lucide/svelte/icons/file-text';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Upload from '@lucide/svelte/icons/upload';

	type BulkState = 'empty' | 'uploading' | 'validation' | 'processing' | 'results';

	let searchBy = $state<SearchByType>('utr');
	let bulkState = $state<BulkState>('empty');
	let selectedFile = $state<File | null>(null);
	let uploadProgress = $state(0);
	let dropError = $state<string | null>(null);
	let uploadError = $state<string | null>(null);
	let validation = $state<BulkValidation | null>(null);
	let results = $state<BulkResult | null>(null);
	let isDragOver = $state(false);

	const identifierLabel = $derived(searchByLabel(searchBy));
	const isBusy = $derived(bulkState === 'uploading' || bulkState === 'processing');
	const dropDisabled = $derived(isBusy);
	const identifierDisabled = $derived(
		bulkState === 'uploading' || bulkState === 'processing' || bulkState === 'validation'
	);

	function resetToEmpty() {
		bulkState = 'empty';
		selectedFile = null;
		uploadProgress = 0;
		dropError = null;
		uploadError = null;
		validation = null;
		results = null;
	}

	function validateFile(file: File): string | null {
		if (!file.name.toLowerCase().endsWith('.csv')) {
			return 'Only .csv files are accepted.';
		}
		if (file.size === 0) {
			return 'The selected file is empty.';
		}
		return null;
	}

	async function startUpload(file: File) {
		const validationError = validateFile(file);
		if (validationError) {
			dropError = validationError;
			return;
		}

		selectedFile = file;
		dropError = null;
		uploadError = null;
		uploadProgress = 0;
		bulkState = 'uploading';

		try {
			validation = await uploadBulkCsv(file, searchBy, (percent) => {
				uploadProgress = percent;
			});
			uploadProgress = 100;
			bulkState = 'validation';
		} catch (error) {
			uploadError =
				error instanceof CheckStatusApiError ? error.message : 'Upload failed. Please try again.';
			bulkState = 'empty';
			selectedFile = null;
		}
	}

	function handleFileInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		void startUpload(file);
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragOver = false;
		if (dropDisabled) return;
		const file = event.dataTransfer?.files?.[0];
		if (!file) return;
		void startUpload(file);
	}

	async function handleProcess() {
		if (!validation || validation.valid === 0 || bulkState !== 'validation') return;

		bulkState = 'processing';
		try {
			results = await processBulkBatch(validation.uploadId);
			bulkState = 'results';
		} catch (error) {
			uploadError =
				error instanceof CheckStatusApiError
					? error.message
					: 'Processing failed. Please try again.';
			bulkState = 'validation';
		}
	}

	function downloadSampleCsv() {
		const sample = ['identifier', 'TXN-2024-AB12CD', 'TXN-2024-EF34GH', 'TXN-2024-IJ56KL'].join(
			'\n'
		);
		const blob = new Blob([sample], { type: 'text/csv;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = 'sample-transaction-status.csv';
		anchor.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="grid gap-6 lg:grid-cols-[minmax(0,32rem)_1fr] lg:items-stretch">
	<!-- Left: upload & controls (matches Single Transaction input card) -->
	<Card.Root class="flex h-full flex-col gap-0 py-0 shadow-sm">
		<Card.Content class="flex h-full flex-col gap-6 p-4 sm:p-5">
			<SearchWithDropdown
				label="Identifier type"
				bind:value={searchBy}
				options={[...SEARCH_BY_OPTIONS]}
				disabled={identifierDisabled}
			/>

			<p class="text-sm text-muted-foreground">
				{#if identifierDisabled}
					Identifier is locked while this batch is in progress.
				{:else}
					Each row in your CSV should contain one {identifierLabel}.
				{/if}
			</p>

			{#if bulkState === 'empty'}
				<label
					class={cn(
						'flex min-h-36 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-5 text-center transition-colors',
						'focus-within:ring-3 focus-within:ring-ring/50 focus-within:outline-none',
						isDragOver
							? 'border-primary/60 bg-primary/5'
							: 'border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50',
						dropDisabled && 'pointer-events-none opacity-50'
					)}
					ondragover={(event) => {
						event.preventDefault();
						isDragOver = true;
					}}
					ondragleave={() => (isDragOver = false)}
					ondrop={handleDrop}
				>
					<span
						class="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
					>
						<Upload class="size-5" />
					</span>
					<div class="space-y-1">
						<p class="text-sm font-medium text-foreground">Drag and drop your CSV here</p>
						<p class="text-sm text-muted-foreground">or click to browse files</p>
						<p class="text-xs text-muted-foreground">CSV only · Max 1,000 rows</p>
					</div>
					<input
						type="file"
						accept=".csv,text/csv"
						class="sr-only"
						disabled={dropDisabled}
						onchange={handleFileInput}
					/>
				</label>

				{#if dropError}
					<p class="text-sm text-destructive" role="alert">{dropError}</p>
				{/if}
				{#if uploadError}
					<div class="flex flex-wrap items-center gap-3">
						<p class="text-sm text-destructive" role="alert">{uploadError}</p>
						<Button variant="outline" size="sm" onclick={resetToEmpty}>
							<RotateCcw class="size-4" />
							Retry
						</Button>
					</div>
				{/if}

				<div class="border-t border-border pt-4">
					<Button variant="outline" class="w-full" onclick={downloadSampleCsv}>
						<Download class="size-4" />
						Download Sample CSV
					</Button>
				</div>
			{:else if bulkState === 'uploading' && selectedFile}
				<div class="flex flex-col gap-4">
					<div class="flex items-center gap-3">
						<span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
							<FileText class="size-5 text-muted-foreground" />
						</span>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-foreground">{selectedFile.name}</p>
							<p class="text-sm text-muted-foreground">Uploading file...</p>
						</div>
						<p class="text-sm font-medium text-foreground tabular-nums">{uploadProgress}%</p>
					</div>
					<Progress value={uploadProgress} max={100} />
				</div>
			{:else if validation}
				<div class="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-3">
					<FileText class="size-4 shrink-0 text-muted-foreground" />
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium text-foreground">{validation.filename}</p>
						<p class="text-xs text-muted-foreground">{identifierLabel}</p>
					</div>
				</div>

				<div class="flex flex-col gap-3 pt-1">
					{#if bulkState === 'validation'}
						<Button disabled={validation.valid === 0} onclick={() => void handleProcess()}>
							Check status for {validation.valid} transactions
						</Button>
						{#if uploadError}
							<p class="text-sm text-destructive" role="alert">{uploadError}</p>
						{/if}
						<Button variant="outline" onclick={resetToEmpty}>
							<RotateCcw class="size-4" />
							Replace file
						</Button>
					{:else if bulkState === 'processing'}
						<Button disabled>
							<LoaderCircle class="size-4 animate-spin" />
							Checking...
						</Button>
					{:else if bulkState === 'results'}
						<Button variant="outline" onclick={resetToEmpty}>
							<RotateCcw class="size-4" />
							New batch
						</Button>
					{/if}
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Right: validation / processing / results (matches Single Transaction result card) -->
	{#if bulkState === 'validation' && validation}
		<Card.Root class="flex h-full flex-col gap-0 overflow-hidden py-0 shadow-sm">
			<div
				class="flex flex-col gap-2 border-b border-success/40 bg-success/8 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
			>
				<div class="flex items-center gap-2">
					<CircleCheckBig class="size-5 text-success" />
					<p class="text-sm font-semibold text-foreground">File validated</p>
				</div>
				<Chip variant="success">{validation.valid} valid</Chip>
			</div>
			<Card.Content class="flex flex-col gap-4 p-4 sm:p-5">
				<p class="text-sm text-muted-foreground">
					{validation.totalRows} rows detected · {validation.valid} ready to check
				</p>
				<div class="grid gap-3 sm:grid-cols-3">
					<StatusStatCard label="Valid" count={validation.valid} color="success" />
					<StatusStatCard label="Invalid" count={validation.invalid} color="destructive" />
					<StatusStatCard label="Duplicates" count={validation.duplicates} color="warning" />
				</div>
				{#if validation.errorReportUrl}
					<a
						href={resolve(validation.errorReportUrl as '/')}
						class="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
					>
						<Download class="size-4" />
						Download error report
					</a>
				{:else}
					<p class="text-xs text-muted-foreground">All rows passed validation checks.</p>
				{/if}
			</Card.Content>
		</Card.Root>
	{:else if bulkState === 'processing' && validation}
		<Card.Root class="flex h-full flex-col gap-0 py-0 shadow-sm">
			<Card.Content
				class="flex h-full flex-col items-center justify-center gap-4 p-5 text-center sm:p-6"
			>
				<div class="relative flex size-14 items-center justify-center">
					<span class="absolute inset-0 animate-ping rounded-full bg-primary/20"></span>
					<LoaderCircle class="relative size-8 animate-spin text-primary" />
				</div>
				<div class="max-w-sm space-y-1">
					<p class="text-sm font-semibold text-foreground">
						Checking {validation.valid} transactions...
					</p>
					<p class="text-sm text-muted-foreground">
						Please do not close this page while we process your batch.
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	{:else if bulkState === 'results' && validation && results}
		<Card.Root class="flex h-full flex-col gap-0 overflow-hidden border-primary/20 py-0 shadow-sm">
			<div
				class="flex flex-col gap-2 border-b border-primary/20 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
			>
				<div class="flex items-center gap-2">
					<CircleCheckBig class="size-5 text-primary" />
					<p class="text-sm font-semibold text-foreground">Batch complete</p>
				</div>
				<Chip variant="default">{results.total} processed</Chip>
			</div>
			<Card.Content class="flex flex-col gap-4 p-4 sm:p-5">
				<p class="text-sm text-muted-foreground">
					{validation.filename} · {identifierLabel}
				</p>
				<div class="grid gap-3 sm:grid-cols-3">
					<StatusStatCard label="Success" count={results.success} color="success" />
					<StatusStatCard label="Failed" count={results.failed} color="destructive" />
					<StatusStatCard label="Pending" count={results.pending} color="warning" />
				</div>
				<Button variant="outline" class="w-fit" href={results.resultsCsvUrl}>
					<Download class="size-4" />
					Download results CSV
				</Button>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
