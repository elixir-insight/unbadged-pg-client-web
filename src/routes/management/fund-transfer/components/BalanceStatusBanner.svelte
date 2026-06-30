<script lang="ts">
	import type { BalanceStatus } from '../types';
	import { cn } from '$lib/utils';
	import { Info, AlertCircle, CheckCircle2 } from '$lib/assets/icons';

	let {
		status,
		message
	}: {
		status: BalanceStatus;
		message: string;
	} = $props();

	const toneClass = $derived(
		status === 'ok'
			? 'bg-success-bg text-success'
			: status === 'warning'
				? 'bg-warning-bg text-warning-foreground'
				: 'bg-destructive/10 text-destructive'
	);

	const Icon = $derived(status === 'ok' ? CheckCircle2 : status === 'warning' ? Info : AlertCircle);
</script>

<div
	class={cn(
		'flex items-start gap-2 rounded-lg border border-border px-3 py-2.5 text-sm',
		toneClass
	)}
	role="status"
>
	<Icon class="mt-0.5 size-4 shrink-0" />
	<p>{message}</p>
</div>
