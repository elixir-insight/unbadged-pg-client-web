<script lang="ts">
	import { Info } from '$lib/assets/icons';
</script>

<div
	class="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3"
	role="status"
>
	<Info class="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
	<p class="text-sm text-foreground">
		Large reports may take several minutes to prepare. Download will begin automatically once the
		report is generated.
	</p>
</div>
