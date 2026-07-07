<script lang="ts">
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { organizations } from '$lib/data/mockData';
	import { DocumentsTab } from '$lib/components/organization';
	import { getOrganizationOrgContext } from '../../organization-org.svelte';

	const orgState = getOrganizationOrgContext();

	const orgId = $derived(page.params.orgId ?? '');
	const org = $derived(organizations.find((o) => o.id === orgId));

	const isPartnerOrReseller = $derived(
		org?.profileType === 'PARTNER' || org?.profileType === 'RESELLER'
	);

	const isApproved = $derived(
		orgState.effectiveStatus.toUpperCase().replace(/\s+/g, '_') === 'APPROVED'
	);

	const showProfileActivation = $derived(isPartnerOrReseller && isApproved);

	const documentDirectors = $derived(
		orgState.detail.kyb.directors.map((director, index) => ({
			id: index + 1,
			name: director.name,
			aadhaar: director.aadhaar,
			pan: director.pan,
			email: director.email,
			phone: director.phone
		}))
	);

	async function handleConfirmActivate() {
		await orgState.confirmActivate();
		if (org) {
			org.status = 'ACTIVE';
		}
		toast.success('Organization activated successfully');
	}
</script>

{#if org}
	<DocumentsTab
		orgName={org.name}
		documents={orgState.documents}
		directors={documentDirectors}
		businessType={org.businessType}
		agreementUploaded={orgState.agreementUploaded}
		onagreementchange={(file) => orgState.syncAgreementDocument(file)}
		{showProfileActivation}
		onactivate={handleConfirmActivate}
	/>
{/if}
