<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import { Dropdown, FileUpload } from '$lib/components/reusable';
	import type { DropdownOption } from '$lib/components/reusable';
	import { Chip } from '$lib/components/ui/badge';
	import { CheckCircle2, Loader2, LockIcon } from '$lib/assets/icons';
	import type { DocumentKey, DocumentSlot } from '$lib/types/onboarding';
	import { DOCUMENT_ACCEPT, DOCUMENT_MAX_BYTES } from './validation';

	let {
		label,
		documentType,
		documentSlot,
		fieldOptions,
		locked = false,
		onuploaded,
		onclear
	}: {
		label: string;
		documentType: DocumentKey;
		documentSlot: DocumentSlot;
		/**
		 * The backend fields this slot uploads under (see ORG_DOCUMENT_FIELDS in api/onboarding.ts).
		 * With more than one — e.g. Address Proof: rental agreement or electricity bill — the
		 * uploader picks which document this file is.
		 */
		fieldOptions: DropdownOption[];
		/** Correction mode: this document was not rejected, so it cannot be replaced. */
		locked?: boolean;
		/** Called once the server has confirmed the upload — never optimistically before that. */
		onuploaded: (file: File) => void;
		onclear: () => void;
	} = $props();

	let error = $state('');
	let uploading = $state(false);
	let pickedField = $state('');
	/** The uploader's pick, or the slot's first (default) field until they choose one. */
	const selectedField = $derived(pickedField || fieldOptions[0]?.value || '');
	let formEl: HTMLFormElement;
	// Set right before requestSubmit() and read inside the enhance callback — FileUpload's file
	// (especially a dropped one) never lives on a real <input>, so it can't come from `formData`
	// the way a native field would; it has to be injected there explicitly (see below).
	let pendingFile: File | null = null;

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

	function handleFile(file: File | null) {
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
		pendingFile = file;
		formEl.requestSubmit();
	}

	const onUploadEnhance: SubmitFunction = ({ formData, cancel }) => {
		if (!pendingFile) {
			cancel();
			return;
		}
		formData.set('documentType', documentType);
		formData.set('fieldName', selectedField);
		formData.set('file', pendingFile);
		const file = pendingFile;
		uploading = true;
		return async ({ result }) => {
			uploading = false;
			pendingFile = null;
			if (result.type === 'success') {
				toast.success(`${label} uploaded.`);
				onuploaded(file);
				return;
			}
			error =
				result.type === 'failure' &&
				result.data &&
				typeof result.data === 'object' &&
				'error' in result.data &&
				typeof result.data.error === 'string'
					? result.data.error
					: 'Upload failed. Please try again.';
			toast.error(error);
		};
	};
</script>

<form bind:this={formEl} method="POST" enctype="multipart/form-data" use:enhance={onUploadEnhance}>
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

		{#if locked}
			<div
				class="flex h-9 items-center gap-2 rounded-md bg-muted px-2.5 text-sm text-muted-foreground"
				aria-readonly="true"
			>
				<LockIcon class="size-3.5 shrink-0" />
				<span class="min-w-0 truncate">
					{documentSlot.fileName || (documentSlot.uploaded ? 'Uploaded' : 'Not uploaded')}
				</span>
			</div>
		{:else if documentSlot.uploaded}
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
		{:else}
			{#if fieldOptions.length > 1}
				<Dropdown
					class="mb-2 w-full"
					ariaLabel={`${label} type`}
					value={selectedField}
					options={fieldOptions}
					onValueChange={(value) => (pickedField = value)}
				/>
			{/if}
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
</form>
