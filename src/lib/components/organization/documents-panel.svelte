<script lang="ts">
	import { Button, Dropdown, FileUpload, Chip, toast } from '$lib/components/reusable';
	import type { BadgeVariant } from '$lib/components/ui/badge';
	import DetailPanel from './detail-panel.svelte';
	import type { OrganizationDocumentRow } from '$lib/utils/organization-form';
	import { displayValue } from '$lib/utils/organization-form';
	import { FileText, Download, Pencil } from '$lib/assets/icons';

	let {
		businessDocuments = $bindable(),
		directorDocuments = $bindable()
	}: {
		businessDocuments: OrganizationDocumentRow[];
		directorDocuments: OrganizationDocumentRow[];
	} = $props();

	let editing = $state(false);
	let draftBusiness = $state<OrganizationDocumentRow[]>([]);
	let draftDirector = $state<OrganizationDocumentRow[]>([]);
	let uploadFiles = $state<Record<string, File | null>>({});

	const statusOptions = [
		{ value: 'UPLOADED', label: 'Uploaded' },
		{ value: 'VERIFIED', label: 'Verified' },
		{ value: 'REJECTED', label: 'Rejected' }
	];

	const statusVariantMap: Record<string, BadgeVariant> = {
		UPLOADED: 'info',
		VERIFIED: 'success',
		REJECTED: 'error'
	};

	function startEditing() {
		draftBusiness = businessDocuments.map((doc) => ({ ...doc }));
		draftDirector = directorDocuments.map((doc) => ({ ...doc }));
		uploadFiles = Object.fromEntries(
			[...draftBusiness, ...draftDirector].map((doc) => [doc.id, null])
		);
		editing = true;
	}

	function cancelEditing() {
		editing = false;
		uploadFiles = {};
	}

	function applyUploads(rows: OrganizationDocumentRow[]): OrganizationDocumentRow[] {
		return rows.map((doc) => {
			const uploaded = uploadFiles[doc.id];
			if (!uploaded) return doc;
			return {
				...doc,
				fileName: uploaded.name,
				uploadedAt: new Date().toISOString().slice(0, 10),
				status: 'UPLOADED' as const
			};
		});
	}

	function saveChanges() {
		businessDocuments = applyUploads(draftBusiness);
		directorDocuments = applyUploads(draftDirector);
		editing = false;
		uploadFiles = {};
		toast.success('Documents updated successfully');
	}

	function setBusinessStatus(id: string, status: OrganizationDocumentRow['status']) {
		draftBusiness = draftBusiness.map((doc) => (doc.id === id ? { ...doc, status } : doc));
	}

	function setDirectorStatus(id: string, status: OrganizationDocumentRow['status']) {
		draftDirector = draftDirector.map((doc) => (doc.id === id ? { ...doc, status } : doc));
	}
</script>

{#snippet documentRows(
	docs: OrganizationDocumentRow[],
	onStatusChange: (id: string, status: OrganizationDocumentRow['status']) => void
)}
	<div class="space-y-3">
		{#each docs as doc (doc.id)}
			<div class="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex min-w-0 items-start gap-2.5">
					<div
						class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground"
					>
						<FileText class="size-3.5" />
					</div>
					<div class="min-w-0">
						<p class="text-sm font-medium text-foreground">{doc.name}</p>
						<p class="truncate text-xs text-muted-foreground">{doc.fileName}</p>
						<p class="text-xs text-muted-foreground">
							{doc.category} · Uploaded {displayValue(doc.uploadedAt)}
						</p>
					</div>
				</div>
				<div class="flex flex-wrap items-center gap-2 sm:justify-end">
					{#if editing}
						<Dropdown
							value={doc.status}
							onValueChange={(value) =>
								onStatusChange(doc.id, value as OrganizationDocumentRow['status'])}
							options={statusOptions}
							class="w-36"
						/>
						<FileUpload
							file={uploadFiles[doc.id]}
							onchange={(file) => {
								uploadFiles[doc.id] = file;
							}}
							placeholder="Replace file"
							class="w-full sm:w-52"
						/>
					{:else}
						<Chip variant={statusVariantMap[doc.status] ?? 'secondary'}>{doc.status}</Chip>
						<Button variant="outline" size="sm">
							<Download class="size-3.5" />
							Download
						</Button>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/snippet}

<div class="space-y-4">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<h2 class="text-sm font-semibold text-foreground">Documents</h2>
			<p class="text-xs text-muted-foreground">Submitted compliance and identity files</p>
		</div>
		{#if !editing}
			<Button variant="outline" size="sm" onclick={startEditing}>
				<Pencil class="size-3.5" />
				Edit
			</Button>
		{:else}
			<div class="flex items-center gap-2">
				<Button variant="outline" size="sm" onclick={cancelEditing}>Cancel</Button>
				<Button size="sm" onclick={saveChanges}>Save</Button>
			</div>
		{/if}
	</div>

	<DetailPanel>
		{@render documentRows(editing ? draftBusiness : businessDocuments, setBusinessStatus)}

		{#if (editing ? draftDirector : directorDocuments).length > 0}
			{@render documentRows(editing ? draftDirector : directorDocuments, setDirectorStatus)}
		{/if}
	</DetailPanel>
</div>
