<script lang="ts">
	import { EmptyState } from '$lib/components/reusable';
	import { ZapIcon } from '$lib/assets/icons';
</script>

<div class="rounded-lg border border-border bg-card shadow-2xl">
	<EmptyState
		icon={ZapIcon}
		title="On-demand settlements is currently not available"
		description="This feature isn't enabled for your account yet. Check back soon."
	/>
</div>
