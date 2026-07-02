<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Modal from './modal.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/Modal',
		component: Modal,
		tags: ['autodocs'],
		argTypes: {
			title: { control: 'text' },
			description: { control: 'text' },
			open: { control: 'boolean' }
		},
		args: { title: 'Modal Title', open: true }
	});
</script>

<!-- Basic open modal -->
<Story name="Default" args={{ title: 'Confirm Action', open: true }}>
	{#snippet template(args)}
		<Modal open={false} {...args}>
			<p class="text-sm text-muted-foreground">
				Are you sure you want to continue? This action cannot be undone.
			</p>
		</Modal>
	{/snippet}
</Story>

<!-- With description -->
<Story
	name="With Description"
	args={{
		title: 'Delete Record',
		description: 'This will permanently remove the record.',
		open: true
	}}
>
	{#snippet template(args)}
		<Modal {...args}>
			<p class="text-sm text-muted-foreground">
				All associated data will also be deleted. This cannot be reversed.
			</p>
		</Modal>
	{/snippet}
</Story>

<!-- With footer actions -->
<Story name="With Footer" args={{ title: 'Save Changes', open: true }}>
	{#snippet template(args)}
		<Modal {...args}>
			<p class="text-sm text-muted-foreground">
				Your unsaved changes will be lost if you leave without saving.
			</p>
			{#snippet footer()}
				<button
					type="button"
					class="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
				>
					Cancel
				</button>
				<button
					type="button"
					class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
				>
					Save
				</button>
			{/snippet}
		</Modal>
	{/snippet}
</Story>

<!-- Closed with trigger button -->
<Story name="With Trigger" args={{ title: 'Open via Trigger', open: false }}>
	{#snippet template(args)}
		<Modal {...args}>
			{#snippet trigger()}
				<button
					type="button"
					class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
				>
					Open Modal
				</button>
			{/snippet}
			<p class="text-sm text-muted-foreground">This modal was opened via a trigger button.</p>
		</Modal>
	{/snippet}
</Story>
