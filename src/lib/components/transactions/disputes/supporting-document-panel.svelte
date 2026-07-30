<script lang="ts">
	import { Download, Eye, FileText, Trash2 } from '$lib/assets/icons';
	import { Button, FileUpload, toast } from '$lib/components/reusable';

	interface Props {
		title: string;
		description: string;
	}

	interface SessionDocument {
		id: string;
		file: File;
		uploadedAt: Date;
	}

	let { title, description }: Props = $props();

	let inputRef = $state<HTMLInputElement | null>(null);
	let documents = $state<SessionDocument[]>([]);

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
				uploadedAt: new Date()
			}));

		documents = [...documents, ...newDocuments];
		if (newDocuments.length > 0) {
			toast.success(`${newDocuments.length} document${newDocuments.length === 1 ? '' : 's'} added`);
		}
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

	function removeFile(documentId: string): void {
		documents = documents.filter((document) => document.id !== documentId);
	}
</script>

<section class="flex flex-col rounded-xl border border-border bg-background p-4">
	<div class="flex items-start justify-between gap-3">
		<div>
			<h3 class="text-sm font-semibold text-foreground">{title}</h3>
			<p class="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
		</div>
		<!-- <Button variant="outline" size="sm" class="shrink-0" onclick={() => inputRef?.click()}>
			<UploadCloud class="size-4" />
			Upload Files
		</Button> -->
	</div>

	<button onclick={() => inputRef?.click()}>
		<FileUpload
			bind:inputRef
			variant="dropzone"
			multiple
			accept=".pdf,.jpg,.jpeg,.png,.zip"
			placeholder="PDF, JPG, PNG, ZIP · MAX 20 MB"
			class="mt-4 cursor-pointer"
			onfileschange={addFiles}
		/>
	</button>

	{#if documents.length > 0}
		<ul class="mt-4 flex flex-col gap-3" aria-label="{title} uploaded documents">
			{#each documents as document (document.id)}
				<li class="flex items-center gap-3 rounded-xl border border-border p-3">
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
					</div>
					<div class="flex shrink-0 items-center gap-1">
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
							onclick={() => removeFile(document.id)}
						>
							<Trash2 class="size-4" />
						</Button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>
