<script lang="ts">
	import DetailSection from './detail-section.svelte';
	import DetailField from './detail-field.svelte';
	import type { OnboardingOrgRecord } from '$lib/types/organization';
	import { formatBusinessType, mapDirectorsFromOrg } from '$lib/utils/organization-form';
	import { Building2, Globe, FileText, Users, MapPin } from '$lib/assets/icons';

	let { organization }: { organization: OnboardingOrgRecord } = $props();

	const directors = $derived(mapDirectorsFromOrg(organization));
</script>

<div class="space-y-5">
	<DetailSection
		title="Address & Location"
		description="Registered and communication addresses"
		icon={MapPin}
	>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<DetailField
				label="Address"
				value={organization.addressDetails.address}
				class="sm:col-span-2 lg:col-span-3"
			/>
			<DetailField label="City" value={organization.addressDetails.city} />
			<DetailField label="State" value={organization.addressDetails.state} />
			<DetailField label="Country" value={organization.addressDetails.country} />
			<DetailField label="PIN Code" value={organization.addressDetails.pinCode} />
			<DetailField
				label="Communication Address"
				value={organization.kyb.communicationAddress}
				class="sm:col-span-2 lg:col-span-3"
			/>
		</div>
	</DetailSection>

	<DetailSection
		title="Business Registration"
		description="Legal identifiers and registration details"
		icon={FileText}
	>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<DetailField label="Business Type" value={formatBusinessType(organization.businessType)} />
			<DetailField label="Profile Type" value={formatBusinessType(organization.profileType)} />
			<DetailField label="Business PAN" value={organization.kyb.businessPan} mono />
			<DetailField label="GST Number" value={organization.kyb.gstNumber} mono />
			<DetailField label="CIN" value={organization.kyb.cin} mono />
			<DetailField label="TAN" value={organization.kyb.tan} mono />
			<DetailField label="Registered Year" value={organization.kyb.registeredYear} />
			<DetailField label="Industry" value={organization.kyb.industry} />
		</div>
	</DetailSection>

	<DetailSection title="Contact & Branding" description="Public contact information" icon={Globe}>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<DetailField label="Email" value={organization.userEmail} />
			<DetailField label="Phone" value={organization.phoneNumber} />
			<DetailField label="Business Phone" value={organization.kyb.businessPhone} />
			<DetailField
				label="Website"
				value={organization.kyb.organizationWebsite}
				class="sm:col-span-2"
			/>
		</div>
	</DetailSection>

	<DetailSection
		title="Directors & Signatories"
		description="{directors.length} registered director{directors.length === 1 ? '' : 's'}"
		icon={Users}
	>
		{#if directors.length === 0}
			<p class="text-sm text-muted-foreground">No director records available.</p>
		{:else}
			<div class="space-y-3">
				{#each directors as director, index (director.id)}
					<div class="rounded-lg border border-border/60 bg-background/50 p-4">
						<p class="mb-3 text-sm font-semibold text-foreground">
							{index + 1}. {director.name || `Director ${index + 1}`}
						</p>
						<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							<DetailField label="Aadhaar" value={director.aadhaar} mono />
							<DetailField label="PAN" value={director.pan} mono />
							<DetailField label="Email" value={director.email} />
							<DetailField label="Phone" value={director.phone} />
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</DetailSection>

	<DetailSection title="Organization Summary" icon={Building2}>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<DetailField label="Organization ID" value={organization.orgId} mono />
			<DetailField label="Affiliate ID" value={organization.affiliateId || undefined} mono />
			<DetailField label="Created At" value={organization.createdAt} />
			<DetailField label="Legal Name" value={organization.legalCompanyName} class="sm:col-span-2" />
		</div>
	</DetailSection>
	Details section extra
</div>
