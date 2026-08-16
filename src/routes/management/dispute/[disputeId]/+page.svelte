<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/reusable';
</script>

<div class="rounded-xl border border-border bg-background p-8 text-center shadow-sm">
	<p class="text-sm font-medium text-foreground">Dispute not found</p>
	<p class="mt-1 text-xs text-muted-foreground">This dispute is not available.</p>
	<Button variant="outline" class="mt-4" onclick={() => goto(resolve('/management/dispute'))}>
		Back to disputes
	</Button>
</div>
