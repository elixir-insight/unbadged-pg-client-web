<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { InsightsMonthCalendar } from '$lib/components/transaction-insights';

	let { data } = $props();

	const merchantId = $derived(page.params.merchantId ?? data.merchant.id);

	function onMonthChange(year: number, month: number) {
		const base = resolve('/management/transaction-insights/[merchantId]', { merchantId });
		const nextUrl = `${base}?year=${year}&month=${month}` as `${typeof base}?${string}`;
		// Pathname is resolve()'d; query params are appended for month navigation.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(nextUrl, {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}
</script>

<div class="p-6 sm:p-8 lg:p-4">
	<InsightsMonthCalendar
		merchant={data.merchant}
		daySummaries={data.daySummaries}
		year={data.year}
		month={data.month}
		{onMonthChange}
	/>
</div>
