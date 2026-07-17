<script lang="ts">
	import FieldRow from './field-row.svelte';

	let {
		configuration
	}: {
		configuration: { callbackUrl: string; ipWhitelist: string };
	} = $props();
</script>

<div class="flex flex-col gap-5">
	<FieldRow label="Callback URL" value={configuration.callbackUrl} code copyable />
	<!-- <FieldRow label="Webhook URL" value={configuration.webhookUrl} code copyable /> -->
	<FieldRow label="IP Whitelist" value={configuration.ipWhitelist} code copyable />
</div>
