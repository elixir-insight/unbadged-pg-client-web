<script lang="ts">
	let {
		label,
		value
	}: {
		label: string;
		value: string | null | undefined;
	} = $props();
</script>

<div>
	<p class="mb-1 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
		{label}
	</p>
	<p class="font-mono text-sm font-medium text-foreground">
		{value || '—'}
	</p>
</div>
