<script lang="ts">
	import { cn } from '$lib/utils';
	import { UploadCloud, Paperclip, X } from '$lib/assets/icons';
	import { fly } from 'svelte/transition';

	interface Props {
		file?: File | null;
		inputRef?: HTMLInputElement | null;
		accept?: string;
		placeholder?: string;
		disabled?: boolean;
		multiple?: boolean;
		variant?: 'compact' | 'dropzone';
		class?: string;
		onchange?: (file: File | null) => void;
		onfileschange?: (files: File[]) => void;
	}

	let {
		file = $bindable(null),
		inputRef = $bindable(null),
		accept = '.pdf,.png,.jpg,.jpeg',
		placeholder = 'Click or drag a file to upload',
		disabled = false,
		multiple = false,
		variant = 'compact',
		class: className,
		onchange,
		onfileschange
	}: Props = $props();

	let isDragOver = $state(false);

	function formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function applyFile(incoming: File | null | undefined) {
		file = incoming ?? null;
		onchange?.(file);
	}

	function applyFiles(incoming: File[]) {
		if (multiple) {
			onfileschange?.(incoming);
			return;
		}
		applyFile(incoming[0]);
	}

	function handleInputChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		applyFiles(Array.from(input.files ?? []));
		input.value = '';
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;
		if (disabled) return;
		applyFiles(Array.from(e.dataTransfer?.files ?? []));
	}

	function removeFile() {
		file = null;
		onchange?.(null);
	}
</script>

<div class={cn('w-full', className)}>
	{#if variant === 'dropzone'}
		<div
			role="region"
			aria-label="File drop zone"
			class={cn(
				// `relative` anchors the sr-only (absolute) file input to this box — otherwise it's
				// positioned against some distant ancestor, and focusing it on click scrolls that one.
				'relative flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed px-5 py-6 text-center transition-all duration-200',
				isDragOver ? 'border-primary/60 bg-primary/6' : 'border-muted-foreground/25 bg-muted/10',
				disabled && 'pointer-events-none opacity-50'
			)}
			ondragover={(event) => {
				event.preventDefault();
				isDragOver = true;
			}}
			ondragleave={() => (isDragOver = false)}
			ondrop={handleDrop}
		>
			<span class="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
				<UploadCloud class="size-6" />
			</span>
			<p class="mt-4 text-sm font-semibold text-foreground">Drag & Drop files here</p>
			<p class="mt-3 text-xs text-muted-foreground">{placeholder}</p>
			<input
				bind:this={inputRef}
				type="file"
				class="sr-only"
				{accept}
				{disabled}
				{multiple}
				onchange={handleInputChange}
			/>
		</div>
	{:else if file}
		<div
			class="flex items-center gap-2.5 rounded-xl border border-primary/25 bg-primary/3 px-3.5 py-2.5 transition-all duration-200"
			in:fly={{ y: -4, duration: 180 }}
		>
			<Paperclip class="size-3.5 shrink-0 text-primary" />
			<div class="min-w-0 flex-1">
				<p class="truncate text-xs font-medium">{file.name}</p>
				<p class="text-[10px] text-muted-foreground">{formatSize(file.size)}</p>
			</div>
			<button
				onclick={removeFile}
				{disabled}
				class="rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive disabled:pointer-events-none"
				aria-label="Remove file"
			>
				<X class="size-3" />
			</button>
		</div>
	{:else}
		<label
			class={cn(
				'relative flex cursor-pointer items-center gap-2.5 rounded-xl border border-dashed px-3.5 py-2.5 transition-all duration-200',
				isDragOver
					? 'border-primary/60 bg-primary/6'
					: 'border-muted-foreground/25 bg-muted/20 hover:border-primary/40 hover:bg-primary/3',
				disabled && 'pointer-events-none opacity-50'
			)}
			ondragover={(e) => {
				e.preventDefault();
				isDragOver = true;
			}}
			ondragleave={() => (isDragOver = false)}
			ondrop={handleDrop}
		>
			<UploadCloud class="size-4 shrink-0 text-muted-foreground/50" />
			<span class="text-xs text-muted-foreground">{placeholder}</span>
			<input
				bind:this={inputRef}
				type="file"
				class="sr-only"
				{accept}
				{disabled}
				{multiple}
				onchange={handleInputChange}
			/>
		</label>
	{/if}
</div>
