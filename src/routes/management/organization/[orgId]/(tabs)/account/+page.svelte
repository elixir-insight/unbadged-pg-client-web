<script lang="ts">
	import { AccountsTab } from '../../components/index';
	import { getOrganizationOrgContext } from '../../organization-org.svelte';
	import type { BankingDetail } from '../../types';

	const orgState = getOrganizationOrgContext();
</script>

<AccountsTab
	banks={orgState.banks}
	onaddbank={(bank: Omit<BankingDetail, 'id'>) => orgState.addBank(bank)}
	oneditbank={(bank: BankingDetail) => orgState.editBank(bank)}
/>
