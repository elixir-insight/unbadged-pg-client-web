<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
	import { Button, Chip, Dropdown } from '$lib/components/reusable';
	import type { DropdownOption } from '$lib/components/reusable';
	import { buttonVariants } from '$lib/components/ui/button';
	import type { BadgeVariant } from '$lib/components/ui/badge';
	import {
		documentChoiceGroups,
		fixedRequiredDocuments,
		privateLimitedExtraDocuments,
		type DocumentStatus,
		type DocumentType,
		type OrganizationDocument
	} from '$lib/data/mockData';
	import {
		cloneOrganization,
		createChipSnippet,
		getAdjacentFlowSteps,
		previewPath,
		todayIso
	} from '../../helpers';
	import { cn } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import { isFileTooLarge, MAX_UPLOAD_FILE_SIZE_LABEL } from '$lib/validation/file-upload';
	import { formDataFieldName } from './map-upload-field';

	let { data } = $props();

	type UploadableDocument = Pick<
		OrganizationDocument,
		'id' | 'fileName' | 'uploadedDate' | 'status'
	> &
		Partial<Pick<OrganizationDocument, 'documentType' | 'optional' | 'activationGate'>>;

	const organization = $derived(data.organization);
	const orgId = $derived(organization.id);
	const isPrivateLimited = $derived(organization.kyb.businessType === 'Private Limited');

	let documents = $state(untrack(() => cloneOrganization(organization.documents)));
	let directors = $state(untrack(() => cloneOrganization(organization.directors)));
	let lastOrgId = $state(untrack(() => organization.id));
	let documentError = $state('');
	let documentErrorId = $state('');
	let choiceSelections = $state<Record<string, DocumentType>>(
		untrack(() => initialChoiceSelections(organization.documents))
	);

	$effect(() => {
		if (organization.id !== lastOrgId) {
			documents = cloneOrganization(organization.documents);
			directors = cloneOrganization(organization.directors);
			choiceSelections = initialChoiceSelections(organization.documents);
			lastOrgId = organization.id;
			documentError = '';
			documentErrorId = '';
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

	async function uploadFileToServer(fieldName: string, file: File) {
		const formData = new FormData();
		formData.append(fieldName, file, file.name);

		const endpoint = resolve('/api/management/onboard/organization/[orgId]/documents', {
			orgId
		});
		const response = await fetch(endpoint, {
			method: 'POST',
			body: formData
		});

		const payload: unknown = await response.json().catch(() => null);
		const message =
			payload &&
			typeof payload === 'object' &&
			'message' in payload &&
			typeof payload.message === 'string'
				? payload.message
				: `Request failed (${response.status})`;

		if (!response.ok) {
			throw new Error(message);
		}

		return message;
	}

	function statusPillVariant(status: DocumentStatus): BadgeVariant {
		if (status === 'Uploaded' || status === 'Approved') return 'success';
		if (status === 'Rejected') return 'error';
		return 'warning';
	}

	function isUploadedOrBetter(status: DocumentStatus): boolean {
		return status === 'Uploaded' || status === 'In Review' || status === 'Approved';
	}

	function persist() {
		organization.documents = cloneOrganization(documents);
		organization.directors = cloneOrganization(directors);
		// Keep kyb directors in sync with organization.directors
		if (organization.kyb) organization.kyb.directors = organization.directors;
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

	function upsertOrgDocument(document: OrganizationDocument) {
		const index = documents.findIndex((entry) => entry.id === document.id);
		if (index === -1) {
			documents = [...documents, document];
			return;
		}
		documents = documents.map((entry, entryIndex) => (entryIndex === index ? document : entry));
	}

	async function runUpload(documentId: string, upload: () => Promise<void>) {
		documentError = '';
		documentErrorId = '';

		try {
			await upload();
			persist();
			toast.success('Document uploaded successfully');
		} catch (error) {
			documentError = error instanceof Error ? error.message : 'Upload failed';
			documentErrorId = documentId;
			toast.error('Upload failed', { description: documentError });
		}
	}

	async function applyOrgUpload(document: OrganizationDocument, file: File) {
		const fieldName = formDataFieldName(document.documentType ?? 'document');
		await runUpload(document.id, async () => {
			await uploadFileToServer(fieldName, file);
			upsertOrgDocument({
				...document,
				fileName: file.name,
				uploadedDate: todayIso(),
				status: 'Uploaded'
			});
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

		await runUpload(documentId, async () => {
			await uploadFileToServer(fieldName, file);
			directors = directors.map((entry) =>
				entry.id === directorId
					? {
							...entry,
							[field]: {
								...entry[field],
								fileName: file.name,
								uploadedDate: todayIso(),
								status: 'Uploaded' as const
							}
						}
					: entry
			);
		});
	}

	function choiceGroupOptions(groupKey: string): DropdownOption[] {
		const group = documentChoiceGroups.find((entry) => entry.key === groupKey);
		return (group?.options ?? []).map((option) => ({ value: option, label: option }));
	}

	function onFileInputChange(documentId: string, event: Event, onFile: (file: File) => void) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) {
			documentError = 'Select a file before uploading.';
			documentErrorId = documentId;
			return;
		}
		if (isFileTooLarge(file)) {
			documentError = `File exceeds the maximum size of ${MAX_UPLOAD_FILE_SIZE_LABEL}.`;
			documentErrorId = documentId;
			toast.error('Upload failed', { description: documentError });
			input.value = '';
			return;
		}
		onFile(file);
		input.value = '';
	}
</script>

{#snippet browseButton(document: UploadableDocument, onFile: (file: File) => void)}
	<label class={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'cursor-pointer')}>
		<input
			type="file"
			class="sr-only"
			onchange={(event) => onFileInputChange(document.id, event, onFile)}
		/>
		{isUploadedOrBetter(document.status) ? 'Replace' : 'Browse file'}
	</label>
{/snippet}

{#snippet statusPill(status: DocumentStatus)}
	<Chip
		variant={statusPillVariant(status)}
		class="h-5 rounded-full px-2 text-xs font-medium"
		children={createChipSnippet(status)}
	/>
{/snippet}

{#snippet documentRow(
	document: UploadableDocument,
	title: string,
	required: boolean,
	onFile: (file: File) => void
)}
	<div class="border-b border-border py-2.5">
		<div class="flex items-center gap-3">
			<p class="min-w-0 flex-1 truncate text-sm">
				{#if required}
					<span class="text-destructive" aria-hidden="true">*</span>
				{/if}
				{title}
			</p>
			{@render statusPill(document.status)}
			{@render browseButton(document, onFile)}
		</div>
		{#if documentError && documentErrorId === document.id}
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
			{@render statusPill(document.status)}
			{@render browseButton(document, (file) => applyOrgUpload(document, file))}
		</div>
		{#if documentError && documentErrorId === document.id}
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
	</div>

	{#if organizationLogoDoc}
		<section class="space-y-1">
			{@render documentRow(organizationLogoDoc, 'Organization logo', false, (file) =>
				applyOrgUpload(organizationLogoDoc, file)
			)}
		</section>
	{/if}

	<section class="space-y-1">
		<h3 class="pb-1 text-sm font-semibold">Required documents</h3>
		{#each fixedDocs as document (document.id)}
			{@render documentRow(document, document.documentType, true, (file) =>
				applyOrgUpload(document, file)
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
				{@render documentRow(document, document.documentType, true, (file) =>
					applyOrgUpload(document, file)
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
				{@render documentRow(director.aadharDocument, 'Aadhar Card', false, (file) =>
					applyDirectorUpload(director.id, 'aadharDocument', file)
				)}
				{@render documentRow(director.panDocument, 'PAN Card', false, (file) =>
					applyDirectorUpload(director.id, 'panDocument', file)
				)}
			</div>
		{/each}
	</section>

	{#if otherDocs.length > 0}
		<section class="space-y-1">
			{#each otherDocs as document (document.id)}
				{@render documentRow(document, document.documentType, !document.optional, (file) =>
					applyOrgUpload(document, file)
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
