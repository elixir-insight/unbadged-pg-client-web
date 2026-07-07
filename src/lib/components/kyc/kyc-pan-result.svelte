<script lang="ts">
	import KycResultRow from './kyc-result-row.svelte';
	import KycStatusBadge from './kyc-status-badge.svelte';
	import KycVerificationRecord from './kyc-verification-record.svelte';
	import type { PanResult } from './types';

	let { result, refId }: { result: PanResult; refId: string } = $props();
</script>

<KycVerificationRecord {refId}>
	<div class="mb-4">
		<KycStatusBadge status={result.verification_status} />
	</div>
	<div class="grid grid-cols-2 gap-x-8">
		<div class="flex flex-col gap-4">
			<KycResultRow label="Full name" value={result.pan_details.full_name} />
			<KycResultRow label="Category" value={result.pan_details.category} />
			<KycResultRow label="Date of birth" value={result.pan_details.dob} />
		</div>
		<div class="flex flex-col gap-4">
			<KycResultRow label="PAN number" value={result.pan_number} />
			<KycResultRow label="Gender" value={result.pan_details.gender} />
			<KycResultRow label="Father's name" value={result.pan_details.father_name} />
		</div>
	</div>
</KycVerificationRecord>
