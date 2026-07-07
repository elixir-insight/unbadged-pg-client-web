<script lang="ts">
	import { ShieldCheck } from '$lib/assets/icons';
</script>

<div
	class="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border px-8 py-10 text-center"
>
	<ShieldCheck class="mb-3 size-8 text-muted-foreground/40" strokeWidth={1.5} />
	<p class="text-sm font-medium text-muted-foreground">No record yet</p>
	<p class="mt-1 max-w-[220px] text-xs text-muted-foreground/80">
		Enter a number above and verify it to see the record here.
	</p>
</div>
