<script lang="ts">
	import { Button } from '$lib/components/reusable';
	import type { WebhookUrlRow } from './webhook-logic';

	interface Props {
		webhook: WebhookUrlRow;
		onedit: (webhook: WebhookUrlRow) => void;
	}

	let { webhook, onedit }: Props = $props();
</script>

<Button
	variant="outline"
	size="sm"
	onclick={(event) => {
		event.stopPropagation();
		onedit(webhook);
	}}
>
	Edit
</Button>
