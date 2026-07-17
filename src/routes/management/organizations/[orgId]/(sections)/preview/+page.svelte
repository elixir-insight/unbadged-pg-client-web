<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { untrack } from 'svelte';
	import { Button, Chip } from '$lib/components/reusable';
	import { BadgeCheck } from '$lib/assets/icons';
	import { cn } from '$lib/utils';
	import { allSectionsComplete } from '../../completeness';
	import {
		cloneOrganization,
		createChipSnippet,
		formatRegisteredAddress,
		maskAccountNumber
	} from '../../helpers';
	import DocumentPreviewModal from '../documents/document-preview-modal.svelte';
	import DocumentActionsMenu from '../documents/document-actions-menu.svelte';
	import { hasDocumentPreview } from '../documents/document-preview';

	type PreviewSection = 'kyb' | 'bank' | 'documents';

	let { data } = $props();

	const organization = $derived(data.organization);
	const orgId = $derived(organization.id);
	const reviewDocuments = $derived(data.documents ?? organization.documents);
	let previewOpen = $state(false);
	let previewTitle = $state('Document preview');
	let previewUrl = $state('');
	let previewFileType = $state<string | undefined>(undefined);

	untrack(() => {
		if (data.documents) {
			data.organization.documents = cloneOrganization(data.documents);
		}
		if (data.directors) {
			data.organization.directors = cloneOrganization(data.directors);
			if (data.organization.kyb) data.organization.kyb.directors = data.organization.directors;
		}
	});

	const canApprove = $derived(allSectionsComplete(data.organization));

	const previewSections: { key: PreviewSection; label: string }[] = [
		{ key: 'kyb', label: 'KYB' },
		{ key: 'bank', label: 'Bank details' },
		{ key: 'documents', label: 'Documents' }
	];

	const activeSection = $derived.by((): PreviewSection => {
		const section = page.url.searchParams.get('section') ?? 'kyb';
		if (section === 'bank' || section === 'documents') return section;
		return 'kyb';
	});

	function previewSectionHref(section: PreviewSection): ResolvedPathname {
		const base = resolve('/management/organizations/[orgId]/preview', { orgId });
		return section === 'kyb' ? base : (`${base}?section=${section}` as ResolvedPathname);
	}

	const continueEditingHref = $derived.by(() => {
		if (activeSection === 'bank') {
			return `/management/organizations/${orgId}/bank`;
		}
		if (activeSection === 'documents') {
			return `/management/organizations/${orgId}/documents`;
		}
		return `/management/organizations/${orgId}/kyb`;
	});

	function approve() {
		data.organization.status = 'APPROVED';
		if (data.organization.category === 'PARTNER') {
			goto(resolve('/management/organizations/[orgId]/activate/partner', { orgId }));
			return;
		}
		goto(resolve('/management/organizations/[orgId]/activate/merchant', { orgId }));
	}

	function openDocumentPreview(
		title: string,
		document: { previewUrl?: string; fileType?: string }
	) {
		if (!document.previewUrl) return;
		previewTitle = title;
		previewUrl = document.previewUrl;
		previewFileType = document.fileType;
		previewOpen = true;
	}
</script>

{#snippet readOnlyField(label: string, value: string)}
	<div class="space-y-1">
		<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
		<p class="text-sm">{value || '—'}</p>
	</div>
{/snippet}

<div class="space-y-6">
	<nav aria-label="Preview sections" class="flex gap-0.5 rounded-lg bg-muted p-1">
		{#each previewSections as section (section.key)}
			{@const isActive = section.key === activeSection}
			{@const sectionHref = previewSectionHref(section.key)}
			<a
				href={sectionHref}
				class={cn(
					'flex flex-1 items-center justify-center rounded-lg px-2 py-1.5 text-sm transition-colors',
					isActive
						? 'bg-primary font-medium text-primary-foreground'
						: 'text-muted-foreground hover:text-foreground'
				)}
				aria-current={isActive ? 'true' : undefined}
			>
				{section.label}
			</a>
		{/each}
	</nav>

	{#if activeSection === 'kyb'}
		<div class="space-y-6">
			<div class="grid gap-4 md:grid-cols-2">
				{@render readOnlyField('Legal Company Name', organization.kyb.legalCompanyName)}
				{@render readOnlyField('Business Type', organization.kyb.businessType)}
				{@render readOnlyField('GSTIN', organization.kyb.gstin)}
				{@render readOnlyField('Business PAN', organization.kyb.businessPan)}
				{@render readOnlyField('Business phone', organization.kyb.businessPhone)}
				{@render readOnlyField('Industry', organization.kyb.industry)}
				{@render readOnlyField('Organization website', organization.kyb.organizationWebsite)}
				{@render readOnlyField(
					'Registered year',
					organization.kyb.registeredYear == null ? '' : String(organization.kyb.registeredYear)
				)}
				{@render readOnlyField('CIN', organization.kyb.cin)}
				{@render readOnlyField('TAN', organization.kyb.tan)}
				{@render readOnlyField('KYB Verification Status', organization.kyb.verificationStatus)}
			</div>
			<div class="space-y-1">
				<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					Registered Address
				</p>
				<p class="text-sm whitespace-pre-line">
					{formatRegisteredAddress(organization.kyb.registeredAddress)}
				</p>
			</div>
			<div class="space-y-1">
				<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					Communication Address
				</p>
				<p class="text-sm whitespace-pre-line">
					{formatRegisteredAddress(organization.kyb.communicationAddress)}
				</p>
			</div>
			<div class="space-y-3">
				<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Directors</p>
				{#if organization.directors.length === 0}
					<p class="text-sm text-muted-foreground">No directors added.</p>
				{:else}
					{#each organization.directors as director (director.id)}
						<p class="text-sm">
							{director.name || 'Unnamed'} — PAN {director.pan || '—'} — Aadhar {director.aadhar ||
								'—'}
						</p>
					{/each}
				{/if}
			</div>
		</div>
	{:else if activeSection === 'bank'}
		<div class="space-y-4">
			{#if organization.bankAccounts.length === 0}
				<p class="text-sm text-muted-foreground">No bank accounts added.</p>
			{:else}
				{#each organization.bankAccounts as account (account.id)}
					<div class="rounded-xl border border-border/60 p-4">
						<div class="mb-3 flex flex-wrap items-center gap-2">
							<p class="text-sm font-medium">{account.accountHolderName || 'Unnamed account'}</p>
							<Chip variant="secondary" children={createChipSnippet(account.status)} />
						</div>
						<div class="grid gap-3 text-sm md:grid-cols-2">
							<p>
								<span class="text-muted-foreground">Account:</span>
								{maskAccountNumber(account.accountNumber)}
							</p>
							<p><span class="text-muted-foreground">IFSC:</span> {account.ifscCode || '—'}</p>
							<p><span class="text-muted-foreground">Bank:</span> {account.bankName || '—'}</p>
							<p><span class="text-muted-foreground">Branch:</span> {account.branch || '—'}</p>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	{:else if activeSection === 'documents'}
		<div class="space-y-3">
			{#each reviewDocuments as document (document.id)}
				<div
					class="flex flex-col gap-2 border-b border-border/60 pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
				>
					<p class="text-sm font-medium">{document.documentType}</p>
					<div class="flex flex-wrap items-center gap-3">
						<p class="text-sm text-muted-foreground">
							{document.status}
							{#if document.uploadedDate}
								· Uploaded {document.uploadedDate}
							{:else if document.status === 'Pending'}
								· Pending
							{/if}
						</p>
						{#if hasDocumentPreview(document)}
							<DocumentActionsMenu
								{document}
								readOnly
								onPreview={() => openDocumentPreview(document.documentType, document)}
							/>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<div class="border-t border-border/60 pt-4">
		{#if !canApprove}
			<p class="mb-4 text-sm text-muted-foreground">
				Approve stays disabled until KYB, bank details, and required documents are complete.
			</p>
		{/if}
		<div class="flex flex-wrap items-center justify-between gap-3">
			<Button variant="outline" href={continueEditingHref}>Continue editing</Button>
			<Button disabled={!canApprove} onclick={approve}>
				<BadgeCheck class="size-4" />
				Approve
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
