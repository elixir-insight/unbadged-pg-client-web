<script lang="ts">
	import { Chip } from '$lib/components/reusable';
	import { Building2, Briefcase, Landmark, SlidersHorizontal } from '$lib/assets/icons';
	import { statusVariant, statusLabel, type MerchantProfileData } from './mock-data';
	import InfoCard from './info-card.svelte';
	import FieldRow from './field-row.svelte';
	import VirtualAccountsCard from './virtual-accounts-card.svelte';
	import ConfigurationFields from './configuration-fields.svelte';
	// import ChangeRequestHistoryCard from './change-request-history-card.svelte';

	let { profile }: { profile: MerchantProfileData } = $props();
</script>

<div class="flex flex-col gap-6">
	<div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
		<InfoCard
			title="Organization Information"
			description="Details about your registered organization"
			icon={Building2}
		>
			<div class="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
				<FieldRow label="Organization Name" value={profile.organization.name} />
				<FieldRow label="Organization Type" value={profile.organization.type} />
				<FieldRow label="Website" value={profile.organization.website} />
				<FieldRow label="Official Email" value={profile.organization.officialEmail} />
				<FieldRow label="Contact Number" value={profile.organization.contactNumber} mono />
				<div class="flex flex-col gap-1.5">
					<span class="text-xs font-medium tracking-wide text-muted-foreground/70 uppercase">
						Organization Status
					</span>
					<Chip variant={statusVariant(profile.organization.status)}>
						{statusLabel(profile.organization.status)}
					</Chip>
				</div>
			</div>
		</InfoCard>

		<InfoCard
			title="Banking Information"
			description="Settlement bank account on record"
			icon={Landmark}
		>
			<div class="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
				<FieldRow label="Bank Name" value={profile.banking.bankName} />
				<FieldRow label="Account Holder Name" value={profile.banking.accountHolderName} />
				<FieldRow label="Account Number" value={profile.banking.maskedAccountNumber} mono />
				<FieldRow label="IFSC Code" value={profile.banking.ifscCode} mono />
				<FieldRow label="Branch Name" value={profile.banking.branchName} />
				<FieldRow label="Account Type" value={profile.banking.accountType} />
			</div>
		</InfoCard>
	</div>

	<InfoCard
		title="Company Information"
		description="Legal and registration details"
		icon={Briefcase}
	>
		<div class="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
			<FieldRow label="Company Name" value={profile.company.name} />
			<FieldRow label="GST Number" value={profile.company.gstNumber} mono copyable />
			<FieldRow label="PAN Number" value={profile.company.panNumber} mono copyable />
			<FieldRow label="CIN Number" value={profile.company.cinNumber} mono copyable />
			<FieldRow label="Registered Address" value={profile.company.registeredAddress} />
			<FieldRow label="City" value={profile.company.city} />
			<FieldRow label="State" value={profile.company.state} />
			<FieldRow label="Country" value={profile.company.country} />
			<FieldRow label="Pincode" value={profile.company.pincode} mono />
		</div>
	</InfoCard>

	<InfoCard
		title="Configuration"
		description="Integration endpoints and network access"
		icon={SlidersHorizontal}
	>
		<ConfigurationFields configuration={profile.configuration} />
	</InfoCard>

	<VirtualAccountsCard accounts={profile.virtualAccounts} />

	<!-- <ChangeRequestHistoryCard requests={profile.changeRequests} /> -->
</div>
