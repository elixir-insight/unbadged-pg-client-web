<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Button, Chip } from '$lib/components/reusable';
	import { BadgeCheck } from '$lib/assets/icons';
	import { cn } from '$lib/utils';
	import { allSectionsComplete } from '../../completeness';
	import {
		createChipSnippet,
		formatRegisteredAddress,
		maskAccountNumber,
		previewPath
	} from '../../helpers';

	type PreviewSection = 'kyb' | 'bank' | 'documents' | 'integration';

	let { data } = $props();

	const organization = $derived(data.organization);
	const orgId = $derived(organization.id);
	const canApprove = $derived(allSectionsComplete(organization));

	const previewSections = $derived.by(() => {
		const sections: { key: PreviewSection; label: string }[] = [
			{ key: 'kyb', label: 'KYB' },
			{ key: 'bank', label: 'Bank details' },
			{ key: 'documents', label: 'Documents' }
		];
		if (organization.category === 'MERCHANT') {
			sections.push({ key: 'integration', label: 'Integration' });
		}
		return sections;
	});

	const activeSection = $derived.by((): PreviewSection => {
		const section = page.url.searchParams.get('section') ?? 'kyb';
		if (section === 'bank' || section === 'documents') return section;
		if (section === 'integration' && organization.category === 'MERCHANT') return 'integration';
		return 'kyb';
	});

	function sectionHref(section: PreviewSection): string {
		const base = previewPath(orgId);
		return section === 'kyb' ? base : `${base}?section=${section}`;
	}

	const continueEditingHref = $derived(`/management/organizations/${orgId}/${activeSection}`);

	function approve() {
		organization.status = 'APPROVED';
		if (organization.category === 'PARTNER') {
			goto(resolve('/management/organizations/[orgId]/activate/partner', { orgId }));
			return;
		}
		goto(resolve('/management/organizations/[orgId]/activate/merchant', { orgId }));
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
			<a
				href={resolve(sectionHref(section.key) as '/')}
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
				{@render readOnlyField('CIN', organization.kyb.cin)}
				{@render readOnlyField('TAN', organization.kyb.tan)}
				{@render readOnlyField('GSTIN', organization.kyb.gstin)}
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
			<div class="space-y-3">
				<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Directors</p>
				{#if organization.directors.length === 0}
					<p class="text-sm text-muted-foreground">No directors added.</p>
				{:else}
					{#each organization.directors as director (director.id)}
						<p class="text-sm">
							{director.name || 'Unnamed'} — {director.designation || 'No designation'} — PAN {director.pan ||
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
			{#each organization.documents as document (document.id)}
				<div
					class="flex flex-col gap-1 border-b border-border/60 pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
				>
					<p class="text-sm font-medium">{document.documentType}</p>
					<p class="text-sm text-muted-foreground">
						{document.status}
						{#if document.uploadedDate}
							· Uploaded {document.uploadedDate}
						{:else if document.status === 'Pending'}
							· Pending
						{/if}
					</p>
				</div>
			{/each}
		</div>
	{:else if activeSection === 'integration'}
		{#if organization.integration}
			<div class="grid gap-4 md:grid-cols-2">
				{@render readOnlyField('Callback URL', organization.integration.callbackUrl)}
				{@render readOnlyField('IP Address', organization.integration.whitelistedIp)}
			</div>
		{:else}
			<p class="text-sm text-muted-foreground">Integration details have not been configured.</p>
		{/if}
	{/if}

	<div class="border-t border-border/60 pt-4">
		{#if !canApprove}
			<p class="mb-4 text-sm text-muted-foreground">
				Approve stays disabled until KYB, bank details, required documents, and merchant integration
				(if applicable) are complete.
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
