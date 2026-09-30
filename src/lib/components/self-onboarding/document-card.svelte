<script lang="ts">
	import { Dropdown, FileUpload } from '$lib/components/reusable';
	import type { DropdownOption } from '$lib/components/reusable';
	import { Chip } from '$lib/components/ui/badge';
	import { CheckCircle2, FileText, Loader2, LockIcon } from '$lib/assets/icons';
	import type { DocumentSlot, PendingDocument } from '$lib/types/onboarding';
	import { DOCUMENT_ACCEPT, DOCUMENT_MAX_BYTES, IMAGE_DOCUMENT_ACCEPT } from './validation';

	let {
		label,
		documentSlot,
		fieldOptions,
		locked = false,
		imageOnly = false,
		pending = null,
		uploading = false,
		onpick,
		ondiscard,
		onclear
	}: {
		label: string;
		documentSlot: DocumentSlot;
		/**
		 * The backend fields this slot uploads under (see ORG_DOCUMENT_FIELDS in api/onboarding.ts).
		 * With more than one — e.g. Address Proof: rental agreement or electricity bill — the
		 * uploader picks which document this file is.
		 */
		fieldOptions: DropdownOption[];
		/** Correction mode: this document was not rejected, so it cannot be replaced. */
		locked?: boolean;
		/** Images only (e.g. the organization logo) — PDFs are rejected. */
		imageOnly?: boolean;
		pending?: PendingDocument | null;
		/** True while the step is uploading this slot's pending file. */
		uploading?: boolean;
		/** A valid file was picked; nothing is uploaded yet. */
		onpick: (document: PendingDocument) => void;
		/** Drops the picked file before it was uploaded. */
		ondiscard: () => void;
		onclear: () => void;
	} = $props();

	let error = $state('');
	let pickedField = $state('');
	/** The uploader's pick, or the slot's first (default) field until they choose one. */
	const selectedField = $derived(pickedField || fieldOptions[0]?.value || '');

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
		if (imageOnly && (file.type === 'application/pdf' || /\.pdf$/i.test(file.name))) return false;
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
			error = imageOnly
				? 'Upload a JPEG, PNG, HEIF, or HEIC image.'
				: 'Upload a PDF, JPEG, PNG, HEIF, or HEIC file.';
			return;
		}
		if (file.size > DOCUMENT_MAX_BYTES) {
			error = 'File must be 5 MB or smaller.';
			return;
		}
		onpick({ file, fieldName: selectedField });
	}
</script>

<div class="rounded-xl border border-border p-4">
	<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
		<div>
			<p class="text-sm font-semibold">{label}</p>
			<p class="text-xs text-muted-foreground">
				{imageOnly ? 'JPEG, PNG, HEIF' : 'PDF, JPEG, PNG, HEIF'} · max 5 MB
			</p>
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
	{:else if pending && uploading}
		<div
			class="flex items-center gap-2.5 rounded-lg border border-dashed border-border px-3.5 py-2.5"
		>
			<Loader2 class="size-4 shrink-0 animate-spin text-muted-foreground" />
			<p class="text-sm text-muted-foreground">Uploading {pending.file.name}…</p>
		</div>
	{:else if pending}
		<div
			class="flex items-center gap-2.5 rounded-xl border border-primary/25 bg-primary/5 px-3.5 py-2.5"
		>
			<FileText class="size-4 shrink-0 text-primary" />
			<div class="min-w-0 flex-1">
				<p class="truncate text-sm font-medium">{pending.file.name}</p>
				<p class="text-xs text-muted-foreground">Uploads when you continue</p>
			</div>
			<button
				type="button"
				class="text-xs font-medium text-muted-foreground hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
				onclick={ondiscard}
			>
				Remove
			</button>
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
				onclick={() => handleFile(null)}
			>
				Replace
			</button>
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
			accept={imageOnly ? IMAGE_DOCUMENT_ACCEPT : DOCUMENT_ACCEPT}
			placeholder="Click or drag a file to upload"
			onchange={handleFile}
		/>
	{/if}

	{#if error}
		<p class="mt-2 text-xs text-destructive">{error}</p>
	{/if}
</div>
