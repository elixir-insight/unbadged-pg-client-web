<script lang="ts">
	import KycResultRow from './kyc-result-row.svelte';
	import KycStatusBadge from './kyc-status-badge.svelte';
	import KycVerificationRecord from './kyc-verification-record.svelte';
	import type { AadhaarResult } from './types';

	let { result, refId }: { result: AadhaarResult; refId: string } = $props();
</script>

<KycVerificationRecord {refId}>
	<div class="mb-4">
		<KycStatusBadge status={result.verification_status} />
	</div>
	<div class="grid grid-cols-2 gap-x-8">
		<div class="flex flex-col gap-4">
			<KycResultRow label="Aadhaar number" value={result.aadhaar_number} />
			<KycResultRow label="Date of birth" value={result.dob} />
			<KycResultRow label="Age range" value={result.age_range} />
			<KycResultRow label="Last digits" value={result.last_digits} />
		</div>
		<div class="flex flex-col gap-4">
			<KycResultRow label="Full name" value={result.full_name} />
			<KycResultRow label="Gender" value={result.gender} />
			<KycResultRow label="State" value={result.state} />
			<KycResultRow label="Mobile linked" value={result.is_mobile ? 'Yes' : 'No'} />
		</div>
	</div>
	<div class="mt-5 flex flex-col gap-4 border-t border-border pt-4">
		<KycResultRow label="Address" value={result.address} />
		<KycResultRow label="Remarks" value={result.remarks} />
	</div>
</KycVerificationRecord>
