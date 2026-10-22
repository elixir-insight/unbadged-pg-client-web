<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { FileUpload } from '$lib/components/reusable';
	import { AlertCircle, CheckCircle2, Loader2 } from '$lib/assets/icons';
	import {
		MAX_UPLOAD_FILE_SIZE_BYTES,
		MAX_UPLOAD_FILE_SIZE_LABEL
	} from '$lib/validation/file-upload';

	let {
		directorId,
		field,
		label,
		uploadedName = '',
		invalid = false,
		locked = false,
		remark = '',
		remarkKey = '',
		highlighted = false,
		ensureDirectorId,
		onuploaded
	}: {
		/** Undefined until the director is saved upstream — see `ensureDirectorId`. */
		directorId: number | undefined;
		/** Matches the multipart field name the backend expects — see upload-documents.ts's
		 * allowedDirectorDocumentFields (management onboarding's confirmed contract). */
		field: 'aadhar' | 'pan';
		label: string;
		/** Name of the document already uploaded for this slot, or '' if none yet. */
		uploadedName?: string;
		/** Highlights the slot as missing once the parent form has attempted to continue. */
		invalid?: boolean;
		/** Correction mode: this document was not rejected, so it cannot be replaced. */
		locked?: boolean;
		/** Management remark on this document — asks for a replacement until one is uploaded. */
		remark?: string;
		/** The remark's `verifications` key — the scroll target for "Fix this". */
		remarkKey?: string;
		/** Set while "Fix this" points at this document. */
		highlighted?: boolean;
		/** Saves the director when it has no id yet; resolves with the reason when that fails. */
		ensureDirectorId: () => Promise<{ ok: true; id: number } | { ok: false; error: string }>;
		onuploaded: (fileName: string) => void;
	} = $props();

	let error = $state('');
	let uploading = $state(false);
	/** The file shown in the picker — cleared on failure so it doesn't look accepted. */
	let pickedFile = $state<File | null>(null);
	let formEl: HTMLFormElement;
	let pendingFile: File | null = null;
	let pendingDirectorId: number | null = null;

	async function handleFile(file: File | null) {
		error = '';
		if (!file) return;
		if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
			error = `File must be ${MAX_UPLOAD_FILE_SIZE_LABEL} or smaller.`;
			pickedFile = null;
			return;
		}
		uploading = true;
		let id = directorId;
		if (id === undefined) {
			const ensured = await ensureDirectorId();
			if (!ensured.ok) {
				uploading = false;
				error = ensured.error;
				pickedFile = null;
				return;
			}
			id = ensured.id;
		}
		pendingFile = file;
		pendingDirectorId = id;
		formEl.requestSubmit();
	}

	const onUploadEnhance: SubmitFunction = ({ formData, cancel }) => {
		if (!pendingFile || pendingDirectorId === null) {
			uploading = false;
			cancel();
			return;
		}
		formData.set('directorId', String(pendingDirectorId));
		formData.set(field, pendingFile);
		const file = pendingFile;
		return async ({ result }) => {
			uploading = false;
			pendingFile = null;
			pendingDirectorId = null;
			if (result.type === 'success') {
				onuploaded(file.name);
				return;
			}
			pickedFile = null;
			if (result.type === 'failure' && result.data && 'debug' in result.data) {
				// Only present in dev builds — the backend's raw answer for this upload.
				console.error(`[director upload] ${field} failed`, result.data.debug);
			}
			error =
				result.type === 'failure' &&
				result.data &&
				typeof result.data === 'object' &&
				'error' in result.data &&
				typeof result.data.error === 'string'
					? result.data.error
					: 'Upload failed. Please try again.';
		};
	};
</script>

<form
	bind:this={formEl}
	method="POST"
	action="?/uploadDirectorDocument"
	enctype="multipart/form-data"
	use:enhance={onUploadEnhance}
>
	<div
		data-remark-field={remarkKey || undefined}
		class={[
			'flex items-center gap-2.5 rounded-lg border border-dashed px-3 py-2',
			remark || highlighted
				? 'border-warning ring-2 ring-warning/40'
				: invalid && !uploadedName
					? 'border-destructive'
					: 'border-border'
		]}
	>
		<div class="min-w-0 flex-1">
			<p class="text-xs font-medium text-foreground">
				{label} <span class="text-destructive">*</span>
			</p>
			{#if uploading}
				<p class="flex items-center gap-1 text-xs text-muted-foreground">
					<Loader2 class="size-3 animate-spin" />
					Uploading…
				</p>
			{:else if uploadedName}
				<p class="flex items-center gap-1 truncate text-xs text-success">
					<CheckCircle2 class="size-3 shrink-0" />
					{uploadedName}
				</p>
			{:else}
				<p class="text-xs text-muted-foreground">Not uploaded</p>
			{/if}
			{#if error}
				<p class="text-xs text-destructive">{error}</p>
			{/if}
			{#if remark}
				<p class="mt-1 flex items-start gap-1.5 text-xs text-warning">
					<AlertCircle class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
					<span class="min-w-0">
						<span class="block font-semibold">Management Remark</span>
						<span class="block">{remark}</span>
						<span class="block text-muted-foreground">
							Please update this document based on the management remark.
						</span>
					</span>
				</p>
			{/if}
		</div>
		{#if !locked}
			<FileUpload
				bind:file={pickedFile}
				accept=".pdf,.jpeg,.jpg,.png"
				placeholder={uploadedName ? 'Replace' : 'Upload'}
				disabled={uploading}
				onchange={(file) => void handleFile(file)}
				class="w-auto shrink-0"
			/>
		{/if}
	</div>
</form>
