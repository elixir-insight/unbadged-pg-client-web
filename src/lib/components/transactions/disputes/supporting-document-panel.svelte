<script lang="ts">
	import type { Component } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		CircleCheck,
		Download,
		Eye,
		FileText,
		Store,
		Trash2,
		TriangleAlert,
		XCircle
	} from '$lib/assets/icons';
	import {
		Button,
		Chip,
		Dropdown,
		FileUpload,
		Modal,
		Switch,
		Textarea,
		toast,
		type DropdownOption
	} from '$lib/components/reusable';
	import type { BadgeVariant } from '$lib/components/ui/badge';
	import { cn } from '$lib/utils';
	import {
		mapDocumentReviewStatus,
		type DisputeDocumentType,
		type DisputeDocumentView,
		type DocumentReviewStatus
	} from '$lib/utils/dispute-documents';

	interface Props {
		title: string;
		description: string;
		documentType: DisputeDocumentType;
		orgId?: string;
		disputeId?: string;
		initialDocuments?: DisputeDocumentView[];
		showMerchantVisibility?: boolean;
		reviewEditable?: boolean;
	}

	interface SessionDocument {
		id: string;
		file: File | null;
		fileName: string;
		fileSizeBytes: number;
		uploadedAt: Date;
		shownToMerchant: boolean;
		reviewStatus: DocumentReviewStatus;
		reviewNote: string;
	}

	interface ReviewStatusMeta {
		label: string;
		chip: BadgeVariant;
		Icon: Component;
		noteClass: string;
	}

	interface UploadedApiDocument {
		documentId?: string;
		fileName?: string;
		fileSizeBytes?: number | null;
		visibleToMerchant?: boolean | null;
		reviewStatus?: string;
		reviewNote?: string;
		createdAt?: string;
	}

	interface UploadApiResponse {
		message?: string;
		uploaded?: UploadedApiDocument[];
		failed?: { fileName?: string; reason?: string }[];
	}

	let {
		title,
		description,
		documentType,
		orgId = '',
		disputeId = '',
		initialDocuments = [],
		showMerchantVisibility = false,
		reviewEditable = false
	}: Props = $props();

	let inputRef = $state<HTMLInputElement | null>(null);
	let documents = $state<SessionDocument[]>([]);
	let syncedDocumentsKey = $state('');
	let isUploading = $state(false);
	let deleteOpen = $state(false);
	let documentPendingDelete = $state<SessionDocument | null>(null);

	const acceptedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
	const maxFileSize = 20 * 1024 * 1024;
	const canUploadToApi = $derived(Boolean(orgId.trim() && disputeId.trim()));

	const reviewStatusOptions: DropdownOption[] = [
		{ value: 'accepted', label: 'Accepted' },
		{ value: 'pending', label: 'Pending' },
		{ value: 'rejected', label: 'Rejected' }
	];

	function reviewStatusMeta(status: DocumentReviewStatus): ReviewStatusMeta {
		if (status === 'accepted') {
			return {
				label: 'Accepted',
				chip: 'success',
				Icon: CircleCheck,
				noteClass: 'border-success/20 bg-success/10'
			};
		}
		if (status === 'rejected') {
			return {
				label: 'Rejected',
				chip: 'error',
				Icon: XCircle,
				noteClass: 'border-destructive/20 bg-destructive/10'
			};
		}
		return {
			label: 'Pending',
			chip: 'warning',
			Icon: TriangleAlert,
			noteClass: 'border-warning/20 bg-warning/10'
		};
	}

	function formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function formatDate(date: Date): string {
		return new Intl.DateTimeFormat('en-IN', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	}

	function parseCreatedAt(value: string | undefined): Date {
		if (!value?.trim()) return new Date();
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? new Date() : date;
	}

	function viewToSession(document: DisputeDocumentView, file: File | null = null): SessionDocument {
		return {
			id: document.id,
			file,
			fileName: document.fileName,
			fileSizeBytes: document.fileSizeBytes,
			uploadedAt: parseCreatedAt(document.createdAt),
			shownToMerchant: document.shownToMerchant,
			reviewStatus: document.reviewStatus,
			reviewNote: document.reviewNote
		};
	}

	function documentsSyncKey(items: DisputeDocumentView[]): string {
		return items
			.map(
				(item) =>
					`${item.id}|${item.reviewStatus}|${item.reviewNote}|${item.shownToMerchant}|${item.fileName}|${item.fileSizeBytes}|${item.createdAt}`
			)
			.join('||');
	}

	$effect(() => {
		const nextKey = documentsSyncKey(initialDocuments);
		if (nextKey === syncedDocumentsKey) return;

		const existingById = new Map(documents.map((document) => [document.id, document]));
		documents = initialDocuments.map((item) =>
			viewToSession(item, existingById.get(item.id)?.file ?? null)
		);
		syncedDocumentsKey = nextKey;
	});

	function validateFiles(files: File[]): File[] {
		return files.filter((file) => {
			const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
			if (!acceptedExtensions.includes(extension)) {
				toast.error(`${file.name} is not a supported file type`);
				return false;
			}
			if (file.size > maxFileSize) {
				toast.error(`${file.name} exceeds the 20 MB limit`);
				return false;
			}
			return true;
		});
	}

	function toSessionDocument(item: UploadedApiDocument, file: File | null): SessionDocument {
		return {
			id: item.documentId?.trim() || crypto.randomUUID(),
			file,
			fileName: item.fileName?.trim() || file?.name || 'document',
			fileSizeBytes: item.fileSizeBytes ?? file?.size ?? 0,
			uploadedAt: parseCreatedAt(item.createdAt),
			shownToMerchant: Boolean(item.visibleToMerchant),
			reviewStatus: mapDocumentReviewStatus(item.reviewStatus),
			reviewNote: item.reviewNote?.trim() ?? ''
		};
	}

	async function uploadFiles(files: File[]): Promise<void> {
		const formData = new FormData();
		formData.append('documentType', documentType);
		for (const file of files) {
			formData.append('files', file, file.name);
		}

		const response = await fetch(
			resolve('/api/management/organizations/[orgId]/disputes/[disputeId]/documents', {
				orgId,
				disputeId
			}),
			{
				method: 'PUT',
				body: formData
			}
		);

		const body: UploadApiResponse = await response.json().catch(() => ({}));
		if (!response.ok) {
			throw new Error(body.message ?? 'Could not upload documents');
		}

		const uploaded = body.uploaded ?? [];
		const failed = body.failed ?? [];
		const filesByName = new Map(files.map((file) => [file.name, file]));

		const nextDocuments = uploaded.map((item) =>
			toSessionDocument(item, filesByName.get(item.fileName?.trim() ?? '') ?? null)
		);

		documents = [...documents, ...nextDocuments];

		if (uploaded.length > 0) {
			toast.success(
				body.message ?? `${uploaded.length} document${uploaded.length === 1 ? '' : 's'} uploaded`
			);
			await invalidate('management-disputes:detail');
		}

		for (const failure of failed) {
			toast.error(failure.fileName?.trim() || 'Upload failed', {
				description: failure.reason?.trim() || 'Could not upload this file'
			});
		}

		if (uploaded.length === 0 && failed.length === 0) {
			toast.success(body.message ?? 'Documents uploaded successfully');
			await invalidate('management-disputes:detail');
		}
	}

	function addLocalFiles(files: File[]): void {
		const newDocuments = files
			.filter(
				(file) =>
					!documents.some(
						(document) =>
							document.fileName === file.name &&
							document.fileSizeBytes === file.size &&
							document.file?.lastModified === file.lastModified
					)
			)
			.map((file) => ({
				id: crypto.randomUUID(),
				file,
				fileName: file.name,
				fileSizeBytes: file.size,
				uploadedAt: new Date(),
				shownToMerchant: false,
				reviewStatus: 'pending' as const,
				reviewNote: ''
			}));

		documents = [...documents, ...newDocuments];
		if (newDocuments.length > 0) {
			toast.success(`${newDocuments.length} document${newDocuments.length === 1 ? '' : 's'} added`);
		}
	}

	async function addFiles(files: File[]): Promise<void> {
		const validFiles = validateFiles(files);
		if (validFiles.length === 0 || isUploading) return;

		if (!canUploadToApi) {
			addLocalFiles(validFiles);
			return;
		}

		isUploading = true;
		try {
			await uploadFiles(validFiles);
		} catch (error) {
			toast.error('Could not upload documents', {
				description: error instanceof Error ? error.message : 'Upload failed'
			});
		} finally {
			isUploading = false;
		}
	}

	function setMerchantVisibility(documentId: string, shownToMerchant: boolean): void {
		documents = documents.map((document) =>
			document.id === documentId ? { ...document, shownToMerchant } : document
		);
	}

	function setReviewStatus(documentId: string, reviewStatus: DocumentReviewStatus): void {
		documents = documents.map((document) =>
			document.id === documentId ? { ...document, reviewStatus } : document
		);
	}

	function setReviewNote(documentId: string, reviewNote: string): void {
		documents = documents.map((document) =>
			document.id === documentId ? { ...document, reviewNote } : document
		);
	}

	function openFile(document: SessionDocument): void {
		if (!document.file) {
			toast.error('Preview is unavailable for this document');
			return;
		}
		const url = URL.createObjectURL(document.file);
		window.open(url, '_blank', 'noopener,noreferrer');
		setTimeout(() => URL.revokeObjectURL(url), 60_000);
	}

	function downloadFile(document: SessionDocument): void {
		if (!document.file) {
			toast.error('Download is unavailable for this document');
			return;
		}
		const url = URL.createObjectURL(document.file);
		const anchor = window.document.createElement('a');
		anchor.href = url;
		anchor.download = document.fileName;
		anchor.click();
		URL.revokeObjectURL(url);
	}

	function openDeleteModal(document: SessionDocument): void {
		documentPendingDelete = document;
		deleteOpen = true;
	}

	function closeDeleteModal(): void {
		deleteOpen = false;
		documentPendingDelete = null;
	}

	function confirmDelete(): void {
		if (!documentPendingDelete) return;
		const fileName = documentPendingDelete.fileName;
		documents = documents.filter((document) => document.id !== documentPendingDelete?.id);
		closeDeleteModal();
		toast.success(`${fileName} deleted`);
	}

	function isReviewStatus(value: string): value is DocumentReviewStatus {
		return value === 'accepted' || value === 'pending' || value === 'rejected';
	}
</script>

<section class="flex flex-col rounded-xl border border-border bg-background p-4">
	<div>
		<h3 class="text-sm font-semibold text-foreground">{title}</h3>
		<p class="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
	</div>

	<button
		type="button"
		class="mt-4 text-left disabled:cursor-not-allowed disabled:opacity-60"
		disabled={isUploading}
		onclick={() => inputRef?.click()}
	>
		<FileUpload
			bind:inputRef
			variant="dropzone"
			multiple
			accept=".pdf,.jpg,.jpeg,.png,.zip"
			placeholder={isUploading ? 'Uploading…' : 'PDF, JPG, PNG, JPEG · MAX 20 MB'}
			class="cursor-pointer"
			disabled={isUploading}
			onfileschange={(files) => {
				void addFiles(files);
			}}
		/>
	</button>

	{#if documents.length > 0}
		<ul class="mt-4 flex flex-col gap-3" aria-label="{title} uploaded documents">
			{#each documents as document (document.id)}
				{@const statusMeta = reviewStatusMeta(document.reviewStatus)}
				{@const StatusIcon = statusMeta.Icon}
				<li class="rounded-xl border border-border p-3">
					<div class="flex items-start gap-3">
						<span
							class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
						>
							<FileText class="size-5" />
						</span>

						<div class="min-w-0 flex-1">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<p class="truncate text-sm font-medium text-foreground">{document.fileName}</p>
									<p class="mt-0.5 text-xs text-muted-foreground">
										{formatDate(document.uploadedAt)} · {formatSize(document.fileSizeBytes)}
									</p>
								</div>

								{#if reviewEditable}
									<div class="w-44 shrink-0">
										<Dropdown
											value={document.reviewStatus}
											options={reviewStatusOptions}
											size="sm"
											ariaLabel="Review status for {document.fileName}"
											class={cn(
												'font-medium shadow-none',
												document.reviewStatus === 'accepted' &&
													'border-success/20 bg-success/15 text-success',
												document.reviewStatus === 'pending' &&
													'border-warning/20 bg-warning/15 text-warning',
												document.reviewStatus === 'rejected' &&
													'border-destructive/20 bg-destructive/10 text-destructive'
											)}
											onValueChange={(value) => {
												if (isReviewStatus(value)) setReviewStatus(document.id, value);
											}}
										/>
									</div>
								{:else}
									<Chip
										variant={statusMeta.chip}
										class="h-auto shrink-0 gap-1 rounded-full px-2.5 py-1"
									>
										<StatusIcon class="size-3.5" />
										{statusMeta.label}
									</Chip>
								{/if}
							</div>
						</div>
					</div>

					<div class={cn('mt-3 w-full rounded-lg border px-3 py-2.5', statusMeta.noteClass)}>
						<p class="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
							Review note
						</p>
						{#if reviewEditable}
							<Textarea
								value={document.reviewNote}
								rows={2}
								placeholder="Add a review note for this document"
								class="mt-1 min-h-0 w-full resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
								aria-label="Review note for {document.fileName}"
								oninput={(event) => {
									const target = event.currentTarget;
									setReviewNote(document.id, target.value);
								}}
							/>
						{:else}
							<p class="mt-1 text-sm text-foreground">
								{document.reviewNote.trim() || 'No review note yet.'}
							</p>
						{/if}
					</div>

					<div class="mt-3 flex flex-wrap items-center justify-between gap-2">
						<div class="flex items-center gap-1">
							<Button
								variant="outline"
								size="icon-sm"
								aria-label="Preview {document.fileName}"
								onclick={() => openFile(document)}
							>
								<Eye class="size-4" />
							</Button>
							<Button
								variant="outline"
								size="icon-sm"
								aria-label="Download {document.fileName}"
								onclick={() => downloadFile(document)}
							>
								<Download class="size-4" />
							</Button>
							<Button
								variant="outline"
								size="icon-sm"
								aria-label="Delete {document.fileName}"
								onclick={() => openDeleteModal(document)}
							>
								<Trash2 class="size-4" />
							</Button>
						</div>

						{#if showMerchantVisibility}
							<label
								class={cn(
									'inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium',
									document.shownToMerchant
										? 'border-primary bg-primary/10 text-primary'
										: 'border-border text-muted-foreground'
								)}
							>
								<Store class="size-3.5 shrink-0" aria-hidden="true" />
								<span>
									{document.shownToMerchant ? 'Shown to merchant' : 'Hidden to merchant'}
								</span>
								<span class="sr-only">
									{document.shownToMerchant
										? `Hide ${document.fileName} from merchant`
										: `Show ${document.fileName} to merchant`}
								</span>
								<Switch
									size="sm"
									checked={document.shownToMerchant}
									onCheckedChange={(checked) => setMerchantVisibility(document.id, checked)}
								/>
							</label>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}

	<Modal bind:open={deleteOpen} title="Delete document">
		{#if documentPendingDelete}
			<p class="text-sm text-muted-foreground">
				Are you sure you want to delete
				<span class="font-medium text-foreground">{documentPendingDelete.fileName}</span>?
			</p>
		{/if}

		{#snippet footer()}
			<Button variant="outline" onclick={closeDeleteModal}>Cancel</Button>
			<Button variant="destructive" onclick={confirmDelete}>Delete</Button>
		{/snippet}
	</Modal>
</section>
