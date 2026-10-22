<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/reusable';
	import { Eye, Loader2, Pencil, Trash2 } from '$lib/assets/icons';
	import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
	import type { OrganizationDocument } from '$lib/data/mockData';
	import { isFileTooLarge, MAX_UPLOAD_FILE_SIZE_LABEL } from '$lib/validation/file-upload';
	import { toast } from 'svelte-sonner';
	import { hasDocumentPreview } from '$lib/components/document-preview';
	import { type DocumentUploadState, isUploadedDocumentStatus } from './document-upload-state';

	type DocumentActionsTarget = Pick<
		OrganizationDocument,
		'id' | 'fileName' | 'status' | 'previewUrl' | 'fileType'
	>;

	interface Props {
		document: DocumentActionsTarget;
		uploadState?: DocumentUploadState;
		readOnly?: boolean;
		onPreview: () => void;
		onReplace?: (file: File) => void;
		onDelete?: () => void;
		onRetry?: () => void;
	}

	let {
		document,
		uploadState = { phase: 'idle' },
		readOnly = false,
		onPreview,
		onReplace = () => {},
		onDelete = () => {},
		onRetry = () => {}
	}: Props = $props();

	let menuOpen = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);

	const isUploaded = $derived(isUploadedDocumentStatus(document.status));
	const isUploading = $derived(uploadState.phase === 'uploading');
	const hasUploadError = $derived(uploadState.phase === 'error');
	const canPreview = $derived(hasDocumentPreview(document));
	const showUploadButton = $derived(!readOnly && !isUploaded && !isUploading && !hasUploadError);
	const showUploadingButton = $derived(!readOnly && isUploading);
	const showRetryButton = $derived(!readOnly && hasUploadError);
	const showActionsMenu = $derived(
		!isUploading && !hasUploadError && (readOnly ? canPreview : isUploaded)
	);

	function handlePreview() {
		menuOpen = false;
		onPreview();
	}

	function handleReplaceClick() {
		menuOpen = false;
		fileInput?.click();
	}

	function handleUploadClick() {
		fileInput?.click();
	}

	function handleDelete() {
		menuOpen = false;
		onDelete();
	}

	function handleFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';

		if (!file) return;

		if (isFileTooLarge(file)) {
			toast.error('Upload failed', {
				description: `File exceeds the maximum size of ${MAX_UPLOAD_FILE_SIZE_LABEL}.`
			});
			return;
		}

		onReplace(file);
	}
</script>

<input bind:this={fileInput} type="file" class="sr-only" onchange={handleFileChange} />

{#if showUploadButton}
	<Button variant="outline" size="sm" type="button" onclick={handleUploadClick}>Upload</Button>
{:else if showUploadingButton}
	<Button variant="outline" size="sm" type="button" disabled>
		<Loader2 class="size-4 animate-spin" />
		Uploading...
	</Button>
{:else if showRetryButton}
	<Button variant="outline" size="sm" type="button" onclick={onRetry}>Retry</Button>
{:else if showActionsMenu}
	<DropdownMenu.Root bind:open={menuOpen}>
		<DropdownMenu.Trigger
			class="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-foreground shadow-xs transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
			aria-label="Document actions"
		>
			<EllipsisVertical class="size-4" />
		</DropdownMenu.Trigger>

		<DropdownMenu.Content align="end" class="min-w-40">
			{#if canPreview}
				<DropdownMenu.Item class="cursor-pointer gap-2" onSelect={handlePreview}>
					<Eye class="size-4" />
					Preview
				</DropdownMenu.Item>
			{/if}

			{#if !readOnly}
				<DropdownMenu.Item class="cursor-pointer gap-2" onSelect={handleReplaceClick}>
					<Pencil class="size-4" />
					Replace
				</DropdownMenu.Item>

				<DropdownMenu.Separator />
				<DropdownMenu.Item
					variant="destructive"
					class="cursor-pointer gap-2"
					onSelect={handleDelete}
				>
					<Trash2 class="size-4" />
					Delete
				</DropdownMenu.Item>
			{/if}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/if}
