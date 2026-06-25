<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import FileUpload from './file-upload.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/FileUpload',
		component: FileUpload,
		tags: ['autodocs'],
		argTypes: {
			accept: { control: 'text', description: 'Accepted file types (e.g. ".pdf,.png")' },
			placeholder: { control: 'text', description: 'Label shown in the drop zone' },
			disabled: { control: 'boolean', description: 'Disables interaction' }
		},
		args: {
			accept: '.pdf,.png,.jpg,.jpeg',
			placeholder: 'Click or drag a file to upload',
			disabled: false
		}
	});
</script>

<!-- Default -->
<Story
	name="Default"
	args={{ accept: '.pdf,.png,.jpg,.jpeg', placeholder: 'Click or drag a file to upload' }}
>
	{#snippet template(args)}
		<div class="w-80">
			<FileUpload {...args} />
		</div>
	{/snippet}
</Story>

<!-- Image Only -->
<Story
	name="Image Only"
	args={{ accept: '.png,.jpg,.jpeg,.webp', placeholder: 'Upload an image (PNG, JPG, WEBP)' }}
>
	{#snippet template(args)}
		<div class="w-80">
			<FileUpload {...args} />
		</div>
	{/snippet}
</Story>

<!-- PDF Only -->
<Story name="PDF Only" args={{ accept: '.pdf', placeholder: 'Upload a PDF document' }}>
	{#snippet template(args)}
		<div class="w-80">
			<FileUpload {...args} />
		</div>
	{/snippet}
</Story>

<!-- Any File -->
<Story name="Any File" args={{ accept: '*', placeholder: 'Upload any file' }}>
	{#snippet template(args)}
		<div class="w-80">
			<FileUpload {...args} />
		</div>
	{/snippet}
</Story>

<!-- Disabled -->
<Story name="Disabled" args={{ disabled: true, placeholder: 'File upload is disabled' }}>
	{#snippet template(args)}
		<div class="w-80">
			<FileUpload {...args} />
		</div>
	{/snippet}
</Story>

<!-- With File (simulated) -->
<Story name="With File">
	{#snippet template()}
		<div class="w-80">
			<FileUpload file={new File([''], 'invoice-march-2026.pdf', { type: 'application/pdf' })} />
		</div>
	{/snippet}
</Story>

<!-- Multiple Slots -->
<Story name="Multiple Fields">
	{#snippet template()}
		<div class="flex w-80 flex-col gap-3">
			<FileUpload accept=".pdf" placeholder="Upload invoice (PDF)" />
			<FileUpload accept=".png,.jpg,.jpeg" placeholder="Upload ID proof (image)" />
			<FileUpload accept=".pdf,.png,.jpg,.jpeg" placeholder="Upload signature" disabled />
		</div>
	{/snippet}
</Story>
