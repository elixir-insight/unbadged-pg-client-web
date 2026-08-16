<script lang="ts">
	import { Download, Eye, FileText, Store, Trash2 } from '$lib/assets/icons';
	import { Button, FileUpload, Modal, Switch, toast } from '$lib/components/reusable';
	import { cn } from '$lib/utils';

	interface Props {
		title: string;
		description: string;
		showMerchantVisibility?: boolean;
	}

	interface SessionDocument {
		id: string;
		file: File;
		uploadedAt: Date;
		shownToMerchant: boolean;
	}

	let { title, description, showMerchantVisibility = false }: Props = $props();

	let inputRef = $state<HTMLInputElement | null>(null);
	let documents = $state<SessionDocument[]>([]);
	let deleteOpen = $state(false);
	let documentPendingDelete = $state<SessionDocument | null>(null);

	const acceptedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'zip'];
	const maxFileSize = 20 * 1024 * 1024;

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

	function addFiles(files: File[]): void {
		const validFiles = files.filter((file) => {
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

		const newDocuments = validFiles
			.filter(
				(file) =>
					!documents.some(
						(document) =>
							document.file.name === file.name &&
							document.file.size === file.size &&
							document.file.lastModified === file.lastModified
					)
			)
			.map((file) => ({
				id: crypto.randomUUID(),
				file,
				uploadedAt: new Date(),
				shownToMerchant: false
			}));

		documents = [...documents, ...newDocuments];
		if (newDocuments.length > 0) {
			toast.success(`${newDocuments.length} document${newDocuments.length === 1 ? '' : 's'} added`);
		}
	}

	function setMerchantVisibility(documentId: string, shownToMerchant: boolean): void {
		documents = documents.map((document) =>
			document.id === documentId ? { ...document, shownToMerchant } : document
		);
	}

	function openFile(document: SessionDocument): void {
		const url = URL.createObjectURL(document.file);
		window.open(url, '_blank', 'noopener,noreferrer');
		setTimeout(() => URL.revokeObjectURL(url), 60_000);
	}

	function downloadFile(document: SessionDocument): void {
		const url = URL.createObjectURL(document.file);
		const anchor = window.document.createElement('a');
		anchor.href = url;
		anchor.download = document.file.name;
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
		const fileName = documentPendingDelete.file.name;
		documents = documents.filter((document) => document.id !== documentPendingDelete?.id);
		closeDeleteModal();
		toast.success(`${fileName} deleted`);
	}
</script>

<section class="flex flex-col rounded-xl border border-border bg-background p-4">
	<div>
		<h3 class="text-sm font-semibold text-foreground">{title}</h3>
		<p class="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
	</div>

	<button type="button" class="mt-4 text-left" onclick={() => inputRef?.click()}>
		<FileUpload
			bind:inputRef
			variant="dropzone"
			multiple
			accept=".pdf,.jpg,.jpeg,.png,.zip"
			placeholder="PDF, JPG, PNG, ZIP · MAX 20 MB"
			class="cursor-pointer"
			onfileschange={addFiles}
		/>
	</button>

	{#if documents.length > 0}
		<ul class="mt-4 flex flex-col gap-3" aria-label="{title} uploaded documents">
			{#each documents as document (document.id)}
				<li class="rounded-xl border border-border p-3">
					<div class="flex gap-3">
						<span
							class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
						>
							<FileText class="size-5" />
						</span>

						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-foreground">{document.file.name}</p>
							<p class="mt-0.5 text-xs text-muted-foreground">
								{formatDate(document.uploadedAt)} · {formatSize(document.file.size)}
							</p>

							<div class="mt-3 flex flex-wrap items-center justify-between gap-2">
								<div class="flex items-center gap-1">
									<Button
										variant="outline"
										size="icon-sm"
										aria-label="Preview {document.file.name}"
										onclick={() => openFile(document)}
									>
										<Eye class="size-4" />
									</Button>
									<Button
										variant="outline"
										size="icon-sm"
										aria-label="Download {document.file.name}"
										onclick={() => downloadFile(document)}
									>
										<Download class="size-4" />
									</Button>
									<Button
										variant="outline"
										size="icon-sm"
										aria-label="Delete {document.file.name}"
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
												? `Hide ${document.file.name} from merchant`
												: `Show ${document.file.name} to merchant`}
										</span>
										<Switch
											size="sm"
											checked={document.shownToMerchant}
											onCheckedChange={(checked) => setMerchantVisibility(document.id, checked)}
										/>
									</label>
								{/if}
							</div>
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{/if}

	<Modal bind:open={deleteOpen} title="Delete document">
		{#if documentPendingDelete}
			<p class="text-sm text-muted-foreground">
				Are you sure you want to delete
				<span class="font-medium text-foreground">{documentPendingDelete.file.name}</span>?
			</p>
		{/if}

		{#snippet footer()}
			<Button variant="outline" onclick={closeDeleteModal}>Cancel</Button>
			<Button variant="destructive" onclick={confirmDelete}>Delete</Button>
		{/snippet}
	</Modal>
</section>
