<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Toast from './toast.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/Toast',
		component: Toast,
		tags: ['autodocs'],
		argTypes: {
			position: {
				control: 'select',
				options: [
					'top-left',
					'top-center',
					'top-right',
					'bottom-left',
					'bottom-center',
					'bottom-right'
				],
				description: 'Position of the toast stack'
			},
			expand: { control: 'boolean', description: 'Expand toasts to full width' },
			richColors: { control: 'boolean', description: 'Use semantic colours per toast type' },
			closeButton: { control: 'boolean', description: 'Show a close button on each toast' },
			duration: { control: 'number', description: 'Auto-dismiss duration in ms' }
		},
		args: {
			position: 'bottom-right',
			expand: false,
			richColors: false,
			closeButton: false,
			duration: 4000
		}
	});
</script>

<script>
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/reusable';
</script>

<!-- Default — all types -->
<Story name="Default" args={{ position: 'bottom-right' }}>
	{#snippet template(args)}
		<Toast {...args} />
		<div class="flex flex-wrap gap-2">
			<Button onclick={() => toast('Default toast message')}>Default</Button>
			<Button onclick={() => toast.success('Action completed successfully!')}>Success</Button>
			<Button onclick={() => toast.error('Something went wrong. Please try again.')}>Error</Button>
			<Button onclick={() => toast.warning('Heads up — review before proceeding.')}>Warning</Button>
			<Button onclick={() => toast.info('Here is some helpful information.')}>Info</Button>
			<Button onclick={() => toast.loading('Loading, please wait…')}>Loading</Button>
		</div>
	{/snippet}
</Story>

<!-- Rich Colours -->
<Story name="Rich Colors" args={{ richColors: true, position: 'bottom-right' }}>
	{#snippet template(args)}
		<Toast {...args} />
		<div class="flex flex-wrap gap-2">
			<Button onclick={() => toast.success('Action completed successfully!')}>Success</Button>
			<Button onclick={() => toast.error('Something went wrong.')}>Error</Button>
			<Button onclick={() => toast.warning('Review before proceeding.')}>Warning</Button>
			<Button onclick={() => toast.info('Helpful information.')}>Info</Button>
		</div>
	{/snippet}
</Story>

<!-- With Close Button -->
<Story name="Close Button" args={{ closeButton: true, position: 'bottom-right' }}>
	{#snippet template(args)}
		<Toast {...args} />
		<div class="flex flex-wrap gap-2">
			<Button onclick={() => toast('This toast has a close button')}>Show Toast</Button>
			<Button onclick={() => toast.success('Done! Click × to dismiss early.')}>Success</Button>
		</div>
	{/snippet}
</Story>

<!-- Expand Mode -->
<Story name="Expand" args={{ expand: true, position: 'bottom-right' }}>
	{#snippet template(args)}
		<Toast {...args} />
		<div class="flex flex-wrap gap-2">
			<Button onclick={() => toast('First toast')}>Toast 1</Button>
			<Button onclick={() => toast.success('Second toast')}>Toast 2</Button>
			<Button onclick={() => toast.error('Third toast')}>Toast 3</Button>
		</div>
	{/snippet}
</Story>

<!-- Position -->
<Story name="Position" args={{ position: 'top-center' }}>
	{#snippet template(args)}
		<Toast {...args} />
		<div class="flex flex-wrap gap-2">
			<Button onclick={() => toast('Appears at the top')}>Show</Button>
			<Button onclick={() => toast.success('Top success!')}>Success</Button>
		</div>
	{/snippet}
</Story>

<!-- With Description -->
<Story name="With Description">
	{#snippet template()}
		<Toast position="bottom-right" />
		<div class="flex flex-wrap gap-2">
			<Button
				onclick={() =>
					toast('Payment processed', {
						description: 'Your payment of ₹4,999 has been received.'
					})}
			>
				With Description
			</Button>
			<Button
				onclick={() =>
					toast.success('Account created', {
						description: 'Welcome aboard! Check your email to verify.'
					})}
			>
				Success + Description
			</Button>
			<Button
				onclick={() =>
					toast.error('Upload failed', {
						description: 'File exceeds the 5 MB limit. Try a smaller file.'
					})}
			>
				Error + Description
			</Button>
		</div>
	{/snippet}
</Story>

<!-- With Action -->
<Story name="With Action">
	{#snippet template()}
		<Toast position="bottom-right" closeButton />
		<div class="flex flex-wrap gap-2">
			<Button
				onclick={() =>
					toast('Message sent', {
						action: { label: 'Undo', onClick: () => toast('Undone!') }
					})}
			>
				With Action
			</Button>
			<Button
				onclick={() =>
					toast.error('File deleted', {
						action: { label: 'Restore', onClick: () => toast.success('File restored') }
					})}
			>
				Error + Action
			</Button>
		</div>
	{/snippet}
</Story>
