<script lang="ts">
	import type { DropdownOption } from '$lib/components/reusable';
	import { ReportGenerationForm } from '$lib/components/reports';
	import { organizations } from '$lib/data/mockData';
	import { getMerchantsWithVans } from '$lib/data/management-van-mock';

	const organizationOptions: DropdownOption[] = organizations.map((org) => ({
		value: org.id,
		label: org.name
	}));

	const merchantOptions: DropdownOption[] = getMerchantsWithVans().map((merchant) => ({
		value: merchant.orgId,
		label: merchant.merchantName
	}));
</script>

<ReportGenerationForm portal="management" {organizationOptions} {merchantOptions} />
