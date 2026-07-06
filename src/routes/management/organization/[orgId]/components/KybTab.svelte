<script lang="ts">
	import DetailSection from '$lib/components/organization/detail-section.svelte';
	import DetailField from '$lib/components/organization/detail-field.svelte';
	import type { KybDetail } from '../types';
	import { Building2, Users } from '$lib/assets/icons';

	interface Props {
		kyb: KybDetail;
	}

	const { kyb }: Props = $props();
</script>

<div class="space-y-5">
	<DetailSection title="KYB Details" icon={Building2}>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<DetailField label="Company Name" value={kyb.companyName} />
			<DetailField label="Country" value={kyb.country} />
			<DetailField label="State" value={kyb.state} />
			<DetailField label="City" value={kyb.city} />
			<DetailField label="Pincode" value={kyb.pincode} />
			<DetailField label="Company GST Number" value={kyb.companyGstNumber} mono />
			<DetailField label="CIN Number" value={kyb.cinNumber} mono />
			<DetailField label="TAN Number" value={kyb.tanNumber} mono />
			<DetailField label="Company Phone Number" value={kyb.companyPhoneNumber} />
			<DetailField label="Company URL" value={kyb.companyUrl} />
			<DetailField label="Business PAN" value={kyb.businessPan} mono />
			<DetailField label="Registered Year" value={kyb.registeredYear} />
			<DetailField label="Industry" value={kyb.industry} />
			<DetailField label="Company Logo" value={kyb.companyLogo} />
			<DetailField label="Address" value={kyb.address} class="sm:col-span-2 lg:col-span-3" />
		</div>
	</DetailSection>

	<DetailSection
		title="Director details"
		description="{kyb.directors.length} registered director{kyb.directors.length === 1 ? '' : 's'}"
		icon={Users}
	>
		{#if kyb.directors.length === 0}
			<p class="text-sm text-muted-foreground">No director records available.</p>
		{:else}
			<div class="space-y-3">
				{#each kyb.directors as director, index (index)}
					<div class="rounded-lg border border-border/60 bg-background/50 p-4">
						<p class="mb-3 text-sm font-semibold text-foreground">
							{index + 1}. {director.name || `Director ${index + 1}`}
						</p>
						<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							<DetailField label="Director Name" value={director.name} />
							<DetailField label="Aadhar" value={director.aadhaar} mono />
							<DetailField label="PAN Number" value={director.pan} mono />
							<DetailField label="Mail ID" value={director.email} />
							<DetailField label="Phone" value={director.phone} />
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</DetailSection>
</div>
