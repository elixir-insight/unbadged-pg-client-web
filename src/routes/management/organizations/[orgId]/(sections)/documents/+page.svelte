<script lang="ts">
	import { beforeNavigate, goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
	import { Button, Chip, Dropdown } from '$lib/components/reusable';
	import type { DropdownOption } from '$lib/components/reusable';
	import {
		documentChoiceGroups,
		fixedRequiredDocuments,
		privateLimitedExtraDocuments,
		type DocumentType,
		type OrganizationDocument
	} from '$lib/data/mockData';
	import {
		cloneOrganization,
		createChipSnippet,
		getAdjacentFlowSteps,
		previewPath
	} from '../../helpers';
	import { toast } from 'svelte-sonner';
	import { formDataFieldName } from './map-upload-field';
	import DocumentPreviewModal from './document-preview-modal.svelte';
	import DocumentActionsMenu from './document-actions-menu.svelte';
	import {
		type DocumentUploadState,
		documentStatusLabel,
		documentStatusVariant,
		getDocumentUploadState
	} from './document-upload-state';

	let { data } = $props();

	type UploadableDocument = Pick<
		OrganizationDocument,
		'id' | 'fileName' | 'uploadedDate' | 'status' | 'previewUrl' | 'fileType'
	> &
		Partial<Pick<OrganizationDocument, 'documentType' | 'optional' | 'activationGate'>>;

	const organization = $derived(data.organization);
	const orgId = $derived(organization.id);
	const isPrivateLimited = $derived(organization.kyb.businessType === 'Private Limited');
	const documentsLoadError = $derived(data.documentsLoadError);

	let documents = $state(untrack(() => cloneOrganization(data.documents)));
	let directors = $state(untrack(() => cloneOrganization(data.directors)));
	let lastOrgId = $state(untrack(() => organization.id));
	let documentError = $state('');
	let documentErrorId = $state('');
	let choiceSelections = $state<Record<string, DocumentType>>(
		untrack(() => initialChoiceSelections(data.documents))
	);
	let previewOpen = $state(false);
	let previewTitle = $state('Document preview');
	let previewUrl = $state('');
	let previewFileType = $state<string | undefined>(undefined);
	let uploadStates = $state<Record<string, DocumentUploadState>>({});
	let retryFiles = $state<Record<string, File>>({});

	untrack(() => {
		data.organization.documents = cloneOrganization(data.documents);
		data.organization.directors = cloneOrganization(data.directors);
		if (data.organization.kyb) data.organization.kyb.directors = data.organization.directors;
	});

	$effect(() => {
		if (organization.id !== lastOrgId) {
			documents = cloneOrganization(data.documents);
			directors = cloneOrganization(data.directors);
			choiceSelections = initialChoiceSelections(data.documents);
			lastOrgId = organization.id;
			documentError = '';
			documentErrorId = '';
			uploadStates = {};
			retryFiles = {};
			data.organization.documents = cloneOrganization(data.documents);
			data.organization.directors = cloneOrganization(data.directors);
			if (data.organization.kyb) data.organization.kyb.directors = data.organization.directors;
		}
	});

	const adjacent = $derived(getAdjacentFlowSteps('documents'));

	const fixedDocs = $derived(
		fixedRequiredDocuments.map((type) => ensureOrgDocument(type, documents))
	);
	const privateLimitedDocs = $derived(
		isPrivateLimited
			? privateLimitedExtraDocuments.map((type) => ensureOrgDocument(type, documents))
			: []
	);
	const organizationLogoDoc = $derived(ensureOrgDocument('Organization logo', documents));
	const otherDocs = $derived(
		documents.filter(
			(document) =>
				(document.activationGate || document.optional) &&
				document.documentType !== 'Organization logo'
		)
	);

	beforeNavigate(({ to }) => {
		if (!to || to.route.id === '/management/organizations') return;
		persist();
	});

	function initialChoiceSelections(docs: OrganizationDocument[]): Record<string, DocumentType> {
		const selections: Record<string, DocumentType> = {};
		for (const group of documentChoiceGroups) {
			const existing = group.options.find((option) =>
				docs.some((document) => document.documentType === option)
			);
			selections[group.key] = existing ?? group.options[0];
		}
		return selections;
	}

	function ensureOrgDocument(
		type: DocumentType,
		docs: OrganizationDocument[]
	): OrganizationDocument {
		const existing = docs.find((document) => document.documentType === type);
		if (existing) return existing;
		return {
			id: type.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
			documentType: type,
			fileName: '',
			status: 'Pending'
		};
	}

	async function uploadFileToServer(
		fieldName: string,
		file: File,
		onProgress?: (progress: number) => void
	) {
		const formData = new FormData();
		formData.append(fieldName, file, file.name);

		const endpoint = resolve('/api/management/onboard/organization/[orgId]/documents', {
			orgId
		});

		return new Promise<string>((resolvePromise, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open('POST', endpoint);
			xhr.responseType = 'json';

			xhr.upload.onprogress = (event) => {
				if (!onProgress || !event.lengthComputable) return;
				onProgress(Math.round((event.loaded / event.total) * 100));
			};

			xhr.onload = () => {
				const payload = xhr.response as {
					message?: string;
					statusCode?: number;
				} | null;
				const message =
					payload && typeof payload.message === 'string'
						? payload.message
						: `Request failed (${xhr.status})`;

				if (xhr.status >= 200 && xhr.status < 300) {
					resolvePromise(message);
					return;
				}

				reject(new Error(message));
			};

			xhr.onerror = () => reject(new Error('Network error'));
			xhr.onabort = () => reject(new Error('Upload cancelled'));
			xhr.send(formData);
		});
	}

	function setUploadState(documentId: string, state: DocumentUploadState) {
		uploadStates = { ...uploadStates, [documentId]: state };
	}

	function clearUploadState(documentId: string) {
		if (!(documentId in uploadStates)) return;
		const next = { ...uploadStates };
		delete next[documentId];
		uploadStates = next;
	}

	function uploadStateFor(documentId: string): DocumentUploadState {
		return getDocumentUploadState(uploadStates, documentId);
	}

	function retryDocumentUpload(
		document: UploadableDocument,
		onReplace: (file: File) => void | Promise<void>
	) {
		const file = retryFiles[document.id];
		if (file) {
			void onReplace(file);
			return;
		}
		clearUploadState(document.id);
	}

	function openDocumentPreview(title: string, document: UploadableDocument) {
		if (!document.previewUrl) return;
		previewTitle = title;
		previewUrl = document.previewUrl;
		previewFileType = document.fileType;
		previewOpen = true;
	}

	async function syncDocumentsFromLoad() {
		documents = cloneOrganization(data.documents);
		directors = cloneOrganization(data.directors);
		choiceSelections = initialChoiceSelections(data.documents);
		persist();
	}

	async function refreshDocumentsFromServer() {
		await invalidate('org-documents');
		await syncDocumentsFromLoad();
	}

	function persist() {
		data.organization.documents = cloneOrganization(documents);
		data.organization.directors = cloneOrganization(directors);
		if (data.organization.kyb) data.organization.kyb.directors = data.organization.directors;
	}

	function navigateAfterSave(href: string) {
		persist();
		goto(resolve(href as '/'));
	}

	function goNext() {
		if (adjacent.next) {
			navigateAfterSave(adjacent.next.href(orgId));
			return;
		}
		navigateAfterSave(previewPath(orgId));
	}

	async function runUpload(
		documentId: string,
		file: File,
		upload: (onProgress: (progress: number) => void) => Promise<void>
	) {
		documentError = '';
		documentErrorId = '';
		retryFiles = { ...retryFiles, [documentId]: file };
		setUploadState(documentId, { phase: 'uploading', progress: null });

		try {
			await upload((progress) => {
				setUploadState(documentId, { phase: 'uploading', progress });
			});

			const nextRetryFiles = { ...retryFiles };
			delete nextRetryFiles[documentId];
			retryFiles = nextRetryFiles;
			clearUploadState(documentId);
			persist();
			toast.success('Document uploaded successfully');
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Upload failed';
			setUploadState(documentId, { phase: 'error', message });
			documentError = message;
			documentErrorId = documentId;
			toast.error('Upload failed', { description: message });
		}
	}

	function matchesDocument(left: OrganizationDocument, right: OrganizationDocument): boolean {
		if (left.id === right.id) return true;
		return Boolean(
			left.documentType && right.documentType && left.documentType === right.documentType
		);
	}

	function resetDocument(document: OrganizationDocument): OrganizationDocument {
		return {
			...document,
			fileName: '',
			uploadedDate: undefined,
			previewUrl: undefined,
			fileType: undefined,
			status: 'Pending'
		};
	}

	function deleteOrgDocument(document: OrganizationDocument) {
		documents = documents.map((entry) =>
			matchesDocument(entry, document) ? resetDocument(entry) : entry
		);
		clearUploadState(document.id);
		const nextRetryFiles = { ...retryFiles };
		delete nextRetryFiles[document.id];
		retryFiles = nextRetryFiles;
		persist();
		toast.success('Document deleted');
	}

	function deleteDirectorDocument(directorId: string, field: 'aadharDocument' | 'panDocument') {
		const director = directors.find((entry) => entry.id === directorId);
		const documentId = director?.[field].id ?? '';

		directors = directors.map((entry) =>
			entry.id === directorId
				? {
						...entry,
						[field]: resetDocument(entry[field])
					}
				: entry
		);

		if (documentId) {
			clearUploadState(documentId);
			const nextRetryFiles = { ...retryFiles };
			delete nextRetryFiles[documentId];
			retryFiles = nextRetryFiles;
		}

		persist();
		toast.success('Document deleted');
	}

	async function applyOrgUpload(document: OrganizationDocument, file: File) {
		const fieldName = formDataFieldName(document.documentType ?? 'document');
		await runUpload(document.id, file, async (onProgress) => {
			await uploadFileToServer(fieldName, file, onProgress);
			await refreshDocumentsFromServer();
		});
	}

	function selectChoiceOption(groupKey: string, option: DocumentType) {
		const group = documentChoiceGroups.find((entry) => entry.key === groupKey);
		if (!group) return;

		documents = documents.filter(
			(document) =>
				!group.options.includes(document.documentType) || document.documentType === option
		);

		if (!documents.some((document) => document.documentType === option)) {
			documents = [
				...documents,
				{
					id: option.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
					documentType: option,
					fileName: '',
					status: 'Pending'
				}
			];
		}

		choiceSelections = { ...choiceSelections, [groupKey]: option };
		persist();
	}

	function selectedChoiceDocument(groupKey: string): OrganizationDocument {
		const selected = choiceSelections[groupKey];
		const group = documentChoiceGroups.find((entry) => entry.key === groupKey);
		const type = selected ?? group?.options[0];
		if (!type) {
			throw new Error(`Unknown document choice group: ${groupKey}`);
		}
		return ensureOrgDocument(type, documents);
	}

	async function applyDirectorUpload(
		directorId: string,
		field: 'aadharDocument' | 'panDocument',
		file: File
	) {
		const documentType = field === 'aadharDocument' ? 'Aadhar Card' : 'PAN Card';
		const fieldName = formDataFieldName(documentType, directorId);
		const documentId = directors.find((entry) => entry.id === directorId)?.[field].id ?? '';

		await runUpload(documentId, file, async (onProgress) => {
			await uploadFileToServer(fieldName, file, onProgress);
			await refreshDocumentsFromServer();
		});
	}

	function choiceGroupOptions(groupKey: string): DropdownOption[] {
		const group = documentChoiceGroups.find((entry) => entry.key === groupKey);
		return (group?.options ?? []).map((option) => ({ value: option, label: option }));
	}
</script>

{#snippet documentStatusChip(document: UploadableDocument)}
	{@const uploadState = uploadStateFor(document.id)}
	<Chip
		variant={documentStatusVariant(document.status, uploadState)}
		class="h-5 rounded-full px-2 text-xs font-medium"
		children={createChipSnippet(documentStatusLabel(document.status, uploadState))}
	/>
{/snippet}

{#snippet uploadProgressBar(documentId: string)}
	{@const uploadState = uploadStateFor(documentId)}
	{#if uploadState.phase === 'uploading' && uploadState.progress !== null}
		<div
			class="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted"
			role="progressbar"
			aria-valuemin="0"
			aria-valuemax="100"
			aria-valuenow={uploadState.progress}
		>
			<div
				class="h-full rounded-full bg-primary transition-[width] duration-150"
				style:width="{uploadState.progress}%"
			></div>
		</div>
	{/if}
{/snippet}

{#snippet documentRow(
	document: UploadableDocument,
	title: string,
	required: boolean,
	onReplace: (file: File) => void | Promise<void>,
	onDelete: () => void
)}
	<div class="border-b border-border py-2.5">
		<div class="flex items-center gap-3">
			<p class="min-w-0 flex-1 truncate text-sm">
				{#if required}
					<span class="text-destructive" aria-hidden="true">*</span>
				{/if}
				{title}
			</p>
			{@render documentStatusChip(document)}
			<DocumentActionsMenu
				{document}
				uploadState={uploadStateFor(document.id)}
				onPreview={() => openDocumentPreview(title, document)}
				{onReplace}
				{onDelete}
				onRetry={() => retryDocumentUpload(document, onReplace)}
			/>
		</div>
		{@render uploadProgressBar(document.id)}
		{#if documentError && documentErrorId === document.id && uploadStateFor(document.id).phase !== 'error'}
			<p class="mt-1.5 text-sm text-destructive">{documentError}</p>
		{/if}
	</div>
{/snippet}

{#snippet choiceGroupRow(groupKey: string, groupLabel: string)}
	{@const document = selectedChoiceDocument(groupKey)}
	<div class="border-b border-border py-2.5">
		<div class="flex items-center gap-3">
			<span class="shrink-0 text-destructive" aria-hidden="true">*</span>
			<div class="w-64 shrink-0">
				<Dropdown
					class="w-full"
					size="sm"
					value={choiceSelections[groupKey]}
					options={choiceGroupOptions(groupKey)}
					placeholder={groupLabel}
					onValueChange={(value) => selectChoiceOption(groupKey, value as DocumentType)}
				/>
			</div>
			<div class="min-w-0 flex-1" aria-hidden="true"></div>
			{@render documentStatusChip(document)}
			<DocumentActionsMenu
				{document}
				uploadState={uploadStateFor(document.id)}
				onPreview={() => openDocumentPreview(document.documentType ?? groupLabel, document)}
				onReplace={(file) => applyOrgUpload(document, file)}
				onDelete={() => deleteOrgDocument(document)}
				onRetry={() => retryDocumentUpload(document, (file) => applyOrgUpload(document, file))}
			/>
		</div>
		{@render uploadProgressBar(document.id)}
		{#if documentError && documentErrorId === document.id && uploadStateFor(document.id).phase !== 'error'}
			<p class="mt-1.5 text-sm text-destructive">{documentError}</p>
		{/if}
	</div>
{/snippet}

<div class="space-y-8">
	<div>
		<h2 class="text-base font-semibold">Documents</h2>
		<p class="mt-1 text-sm text-muted-foreground">
			Upload required documents and supporting files.
		</p>
		{#if documentsLoadError}
			<p class="mt-2 text-sm text-muted-foreground">
				Could not load uploaded documents: {documentsLoadError}
			</p>
		{/if}
	</div>

	{#if organizationLogoDoc}
		<section class="space-y-1">
			{@render documentRow(
				organizationLogoDoc,
				'Organization logo',
				false,
				(file) => applyOrgUpload(organizationLogoDoc, file),
				() => deleteOrgDocument(organizationLogoDoc)
			)}
		</section>
	{/if}

	<section class="space-y-1">
		<h3 class="pb-1 text-sm font-semibold">Required documents</h3>
		{#each fixedDocs as document (document.id)}
			{@render documentRow(
				document,
				document.documentType,
				true,
				(file) => applyOrgUpload(document, file),
				() => deleteOrgDocument(document)
			)}
		{/each}
	</section>

	<section class="space-y-1">
		<h3 class="pb-1 text-sm font-semibold">Choose one per group</h3>
		{#each documentChoiceGroups as group (group.key)}
			{@render choiceGroupRow(group.key, group.label)}
		{/each}
	</section>

	{#if isPrivateLimited}
		<section class="space-y-1">
			<h3 class="pb-1 text-sm font-semibold">Private Limited documents</h3>
			{#each privateLimitedDocs as document (document.id)}
				{@render documentRow(
					document,
					document.documentType,
					true,
					(file) => applyOrgUpload(document, file),
					() => deleteOrgDocument(document)
				)}
			{/each}
		</section>
	{/if}

	<section class="space-y-4">
		<h3 class="text-sm font-semibold">Director documents</h3>
		{#each directors as director (director.id)}
			<div class="space-y-1">
				<h4 class="pb-1 text-sm font-medium text-muted-foreground">
					{director.name || 'Director'} (Director)
				</h4>
				{@render documentRow(
					director.aadharDocument,
					'Aadhar Card',
					false,
					(file) => applyDirectorUpload(director.id, 'aadharDocument', file),
					() => deleteDirectorDocument(director.id, 'aadharDocument')
				)}
				{@render documentRow(
					director.panDocument,
					'PAN Card',
					false,
					(file) => applyDirectorUpload(director.id, 'panDocument', file),
					() => deleteDirectorDocument(director.id, 'panDocument')
				)}
			</div>
		{/each}
	</section>

	{#if otherDocs.length > 0}
		<section class="space-y-1">
			{#each otherDocs as document (document.id)}
				{@render documentRow(
					document,
					document.documentType,
					!document.optional,
					(file) => applyOrgUpload(document, file),
					() => deleteOrgDocument(document)
				)}
			{/each}
		</section>
	{/if}

	<div class="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
		<Button variant="outline" href="/management/organizations">Cancel</Button>
		<div class="flex flex-wrap items-center gap-3">
			<Button onclick={goNext}>
				{adjacent.next?.key === 'review' || !adjacent.next ? 'Review & approve' : 'Next step'}
			</Button>
		</div>
	</div>
</div>

<DocumentPreviewModal
	bind:open={previewOpen}
	title={previewTitle}
	{previewUrl}
	fileType={previewFileType}
/>
