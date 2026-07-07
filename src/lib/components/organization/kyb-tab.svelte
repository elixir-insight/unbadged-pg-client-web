<script lang="ts">
	import DetailPanel from '$lib/components/organization/detail-panel.svelte';
	import DetailField from '$lib/components/organization/detail-field.svelte';
	import DetailFieldGrid from '$lib/components/organization/detail-field-grid.svelte';
	import DetailFieldSpacer from '$lib/components/organization/detail-field-spacer.svelte';
	import type { KybDetail } from './types';

	interface Props {
		kyb: KybDetail;
	}

	const { kyb }: Props = $props();
</script>

<div class="space-y-4">
	<div>
		<h2 class="text-sm font-semibold text-foreground">KYB Details</h2>
		<p class="text-xs text-muted-foreground">Know Your Business information on file</p>
	</div>

	<DetailPanel>
		<DetailFieldGrid>
			<DetailField label="Company Name" value={kyb.companyName} />
			<DetailField label="Industry" value={kyb.industry} />
			<DetailField label="Registered Year" value={kyb.registeredYear} />
			<DetailField label="Company Logo" value={kyb.companyLogo} />
			<DetailField label="Business PAN" value={kyb.businessPan} mono />
			<DetailField label="Company GST Number" value={kyb.companyGstNumber} mono />
			<DetailField label="CIN Number" value={kyb.cinNumber} mono />
			<DetailField label="TAN Number" value={kyb.tanNumber} mono />
			<DetailField label="Address" value={kyb.address} spanFull />
			<DetailField label="Country" value={kyb.country} />
			<DetailField label="State" value={kyb.state} />
			<DetailField label="City" value={kyb.city} />
			<DetailField label="Pincode" value={kyb.pincode} />
			<DetailField label="Company Phone Number" value={kyb.companyPhoneNumber} />
			<DetailField label="Company URL" value={kyb.companyUrl} />
			{#if kyb.directors.length > 0}
				<DetailFieldSpacer />
				<div class="lg:col-span-2">
					<h3 class="text-sm font-semibold text-foreground">Directors</h3>
				</div>
				{#each kyb.directors as director, index (index)}
					<DetailField label="Director {index + 1} Name" value={director.name} />
					<DetailField label="Director {index + 1} Aadhar" value={director.aadhaar} mono />
					<DetailField label="Director {index + 1} PAN" value={director.pan} mono />
					<DetailField label="Director {index + 1} Email" value={director.email} />
					<DetailField label="Director {index + 1} Phone" value={director.phone} />
					{#if index < kyb.directors.length - 1}
						<DetailFieldSpacer class="h-3 sm:h-3.5" />
					{/if}
				{/each}
			{/if}
		</DetailFieldGrid>
	</DetailPanel>
</div>
