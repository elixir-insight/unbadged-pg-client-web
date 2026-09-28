<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/reusable';
	import { buttonVariants } from '$lib/components/ui/button';
	import { ExternalLink } from '$lib/assets/icons';
	import { cn } from '$lib/utils';
	import { getDocumentPreviewKind } from './document-preview';

	interface Props {
		open?: boolean;
		title?: string;
		previewUrl?: string;
		fileType?: string;
	}

	let {
		open = $bindable(false),
		title = 'Document preview',
		previewUrl = '',
		fileType = ''
	}: Props = $props();

	const previewKind = $derived(getDocumentPreviewKind(fileType, previewUrl));
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-4xl flex-col gap-4 overflow-hidden sm:max-w-4xl"
	>
		<Dialog.Header>
			<Dialog.Title>{title}</Dialog.Title>
			<Dialog.Description class="sr-only">Preview uploaded document</Dialog.Description>
		</Dialog.Header>

		{#if previewUrl}
			<div class="min-h-0 flex-1 overflow-auto rounded-lg border border-border bg-muted/30">
				{#if previewKind === 'image'}
					<img
						src={previewUrl}
						alt={title}
						class="mx-auto max-h-[70vh] w-auto max-w-full object-contain p-4"
					/>
				{:else if previewKind === 'pdf'}
					<iframe src={previewUrl} {title} class="h-[70vh] w-full bg-background"></iframe>
				{:else}
					<div class="flex flex-col items-center gap-4 p-8 text-center">
						<p class="text-sm text-muted-foreground">
							Preview is not available for this file type. Open the document in a new tab instead.
						</p>
						<a
							href={previewUrl}
							target="_blank"
							rel="external noopener noreferrer"
							class={cn(buttonVariants({ variant: 'default' }))}
						>
							<ExternalLink class="size-4" />
							Open document
						</a>
					</div>
				{/if}
			</div>

			<Dialog.Footer class={cn('flex flex-wrap items-center justify-end gap-2')}>
				<a
					href={previewUrl}
					target="_blank"
					rel="external noopener noreferrer"
					class={cn(buttonVariants({ variant: 'outline' }))}
				>
					<ExternalLink class="size-4" />
					Open in new tab
				</a>
				<Button variant="outline" type="button" onclick={() => (open = false)}>Close</Button>
			</Dialog.Footer>
		{:else}
			<p class="text-sm text-muted-foreground">No preview available for this document.</p>
		{/if}
	</Dialog.Content>
</Dialog.Root>
