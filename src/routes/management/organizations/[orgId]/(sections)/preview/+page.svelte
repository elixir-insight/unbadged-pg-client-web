<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { toast } from 'svelte-sonner';
	import { Button, Chip } from '$lib/components/reusable';
	import { BadgeCheck, ZapIcon } from '$lib/assets/icons';
	import { cn } from '$lib/utils';
	import {
		allSectionsComplete,
		bankDetailsComplete,
		documentsComplete,
		kybComplete
	} from '../../completeness';
	import { createChipSnippet, formatRegisteredAddress, maskAccountNumber } from '../../helpers';
	import DocumentPreviewModal from '../documents/document-preview-modal.svelte';
	import DocumentActionsMenu from '../documents/document-actions-menu.svelte';
	import { hasDocumentPreview } from '../documents/document-preview';
	import ActivateProfileModal from './activate-profile-modal.svelte';

	type PreviewSection = 'kyb' | 'bank' | 'documents';

	let { data, form } = $props();

	const organization = $derived(data.organization);
	const orgId = $derived(organization.id);
	const reviewDocuments = $derived(data.documents ?? organization.documents);
	let previewOpen = $state(false);
	let previewTitle = $state('Document preview');
	let previewUrl = $state('');
	let previewFileType = $state<string | undefined>(undefined);
	let approving = $state(false);
	let activateOpen = $state(false);

	const isApproved = $derived(organization.status === 'APPROVED');
	const isActive = $derived(organization.status === 'ACTIVE');
	const manageHref = $derived(resolve('/management/organizations/[orgId]/manage', { orgId }));

	const reviewOrganization = $derived.by(() => {
		const org = data.organization;
		const documents = data.documents ?? org.documents;
		const directors = data.directors ?? org.directors;

		return {
			...org,
			documents,
			directors,
			kyb: {
				...org.kyb,
				directors
			}
		};
	});

	const canApprove = $derived(allSectionsComplete(reviewOrganization));

	const approvalBlockers = $derived.by(() => {
		const blockers: string[] = [];
		if (!kybComplete(reviewOrganization)) blockers.push('KYB');
		if (!bankDetailsComplete(reviewOrganization)) blockers.push('bank details');
		if (!documentsComplete(reviewOrganization)) blockers.push('documents');
		return blockers;
	});

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

	function previewSectionHref(section: PreviewSection, organizationId: string): ResolvedPathname {
		const base = resolve(`/management/organizations/${organizationId}/preview`);
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

	const onApproveEnhance: SubmitFunction = ({ cancel }) => {
		if (!canApprove) {
			cancel();
			return;
		}

		approving = true;
		return async ({ result, update }) => {
			approving = false;

			if (result.type === 'failure') {
				const message =
					form?.message ??
					(result.data &&
					typeof result.data === 'object' &&
					'message' in result.data &&
					typeof result.data.message === 'string'
						? result.data.message
						: 'Something went wrong');
				toast.error('Failed to approve profile', { description: message });
				await update({ reset: false });
				return;
			}

			if (result.type === 'success') {
				data.organization.status = 'APPROVED';
				toast.success('Profile approved', {
					description: 'All onboarding sections complete. Activate when ready.'
				});
				await invalidate('org');
			}

			await update({ reset: false });
		};
	};

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
			{@const sectionHref = previewSectionHref(section.key, orgId)}
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
		{#if isActive}
			<p class="mb-4 text-sm text-muted-foreground">
				This organization is active. Open manage to view operational settings.
			</p>
			<div class="flex flex-wrap items-center justify-between gap-3">
				<Button variant="outline" href={continueEditingHref}>Continue editing</Button>
				<Button href={manageHref}>Go to manage</Button>
			</div>
		{:else if isApproved}
			<p class="mb-4 text-sm text-muted-foreground">
				Profile approved. Activate to upload the business certificate, enter gateway credentials,
				and continue to commission configuration.
			</p>
			<div class="flex flex-wrap items-center justify-between gap-3">
				<Button variant="outline" href={continueEditingHref}>Continue editing</Button>
				<Button onclick={() => (activateOpen = true)}>
					<ZapIcon class="size-4" />
					Activate
				</Button>
			</div>
		{:else}
			{#if !canApprove}
				<p class="mb-4 text-sm text-muted-foreground">
					Approve stays disabled until KYB, bank details, and required documents are complete.
					{#if approvalBlockers.length > 0}
						Still incomplete: {approvalBlockers.join(', ')}.
					{/if}
				</p>
			{/if}
			<form method="POST" action="?/approve" use:enhance={onApproveEnhance}>
				<div class="flex flex-wrap items-center justify-between gap-3">
					<Button variant="outline" href={continueEditingHref}>Continue editing</Button>
					<Button type="submit" disabled={!canApprove || approving}>
						<BadgeCheck class="size-4" />
						{approving ? 'Approving…' : 'Approve'}
					</Button>
				</div>
			</form>
		{/if}
	</div>
</div>

<ActivateProfileModal bind:open={activateOpen} category={organization.category} {form} />

<DocumentPreviewModal
	bind:open={previewOpen}
	title={previewTitle}
	{previewUrl}
	fileType={previewFileType}
/>
