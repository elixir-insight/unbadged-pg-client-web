<script lang="ts">
	import { Button, FileUpload } from '$lib/components/reusable';
	import { Chip } from '$lib/components/ui/badge';
	import { CheckCircle2, Loader2 } from '$lib/assets/icons';
	import type { DocumentSlot } from '$lib/types/onboarding';
	import { DOCUMENT_ACCEPT, DOCUMENT_MAX_BYTES } from './validation';

	let {
		label,
		documentSlot,
		disabled = false,
		disabledNote = 'Upload coming soon',
		onupload,
		onclear
	}: {
		label: string;
		documentSlot: DocumentSlot;
		/** Shows a "coming soon" state instead of the upload control. */
		disabled?: boolean;
		disabledNote?: string;
		onupload: (file: File) => void | Promise<void>;
		onclear: () => void;
	} = $props();

	let error = $state('');
	let uploading = $state(false);

	const acceptedTypes = new Set([
		'application/pdf',
		'image/jpeg',
		'image/png',
		'image/heif',
		'image/heic',
		'image/heif-sequence',
		'image/heic-sequence'
	]);

	const acceptedExtensions = new Set(['pdf', 'jpeg', 'jpg', 'png', 'heif', 'heic']);

	function isAccepted(file: File): boolean {
		if (acceptedTypes.has(file.type)) return true;
		const ext = file.name.split('.').pop()?.toLowerCase();
		return ext !== undefined && acceptedExtensions.has(ext);
	}

	async function handleFile(file: File | null) {
		error = '';
		if (!file) {
			onclear();
			return;
		}
		if (!isAccepted(file)) {
			error = 'Upload a PDF, JPEG, PNG, HEIF, or HEIC file.';
			return;
		}
		if (file.size > DOCUMENT_MAX_BYTES) {
			error = 'File must be 5 MB or smaller.';
			return;
		}
		uploading = true;
		try {
			await onupload(file);
		} catch (err) {
			error =
				err instanceof Error && err.message ? err.message : 'Upload failed. Please try again.';
		} finally {
			uploading = false;
		}
	}
</script>

<div class="rounded-xl border border-border p-4">
	<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
		<div>
			<p class="text-sm font-semibold">{label}</p>
			<p class="text-xs text-muted-foreground">PDF, JPEG, PNG, HEIF · max 5 MB</p>
		</div>
		{#if documentSlot.required}
			<Chip variant="secondary">Required</Chip>
		{:else}
			<Chip variant="outline">Optional</Chip>
		{/if}
	</div>

	{#if documentSlot.uploaded}
		<div
			class="flex items-center gap-2.5 rounded-xl border border-success/25 bg-success/10 px-3.5 py-2.5"
		>
			<CheckCircle2 class="size-4 shrink-0 text-success" />
			<p class="min-w-0 flex-1 truncate text-sm font-medium">
				{documentSlot.fileName || 'Uploaded'}
			</p>
			<button
				type="button"
				class="text-xs font-medium text-muted-foreground hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
				disabled={uploading}
				onclick={() => handleFile(null)}
			>
				Replace
			</button>
		</div>
	{:else if uploading}
		<div
			class="flex items-center gap-2.5 rounded-lg border border-dashed border-border px-3.5 py-2.5"
		>
			<Loader2 class="size-4 shrink-0 animate-spin text-muted-foreground" />
			<p class="text-sm text-muted-foreground">Uploading…</p>
		</div>
	{:else if disabled}
		<div
			class="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border px-3.5 py-2.5"
		>
			<p class="text-sm text-muted-foreground">{disabledNote}</p>
			<Button variant="outline" size="sm" disabled>Upload</Button>
		</div>
	{:else}
		<FileUpload
			accept={DOCUMENT_ACCEPT}
			placeholder="Click or drag a file to upload"
			onchange={handleFile}
		/>
	{/if}

	{#if error}
		<p class="mt-2 text-xs text-destructive">{error}</p>
	{/if}
</div>
