<script lang="ts">
	import { page } from '$app/state';
	import RecordEntriesPage from '../../settlements-components/RecordEntriesPage.svelte';
	import { createSettlementsStore, setSettlementsStore } from '../../settlements.svelte';

	const store = createSettlementsStore();
	setSettlementsStore(store);

	const merchantId = $derived(page.params.merchantId ?? '');
	const recordId = $derived(page.params.recordId ?? '');
</script>

<RecordEntriesPage {merchantId} {recordId} />
