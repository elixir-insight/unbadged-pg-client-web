<script lang="ts">
	import { cn } from '$lib/utils';
	import { UploadCloud, Paperclip, X } from '@lucide/svelte';
	import { fly } from 'svelte/transition';

	interface Props {
		file?: File | null;
		accept?: string;
		placeholder?: string;
		disabled?: boolean;
		class?: string;
		onchange?: (file: File | null) => void;
	}

	let {
		file = $bindable(null),
		accept = '.pdf,.png,.jpg,.jpeg',
		placeholder = 'Click or drag a file to upload',
		disabled = false,
		class: className,
		onchange
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

	function handleInputChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		applyFile(input.files?.[0]);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;
		if (disabled) return;
		applyFile(e.dataTransfer?.files?.[0]);
	}

	function removeFile() {
		file = null;
		onchange?.(null);
	}
</script>

<div class={cn('w-full', className)}>
	{#if file}
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
				'flex cursor-pointer items-center gap-2.5 rounded-xl border border-dashed px-3.5 py-2.5 transition-all duration-200',
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
			<input type="file" class="sr-only" {accept} {disabled} onchange={handleInputChange} />
		</label>
	{/if}
</div>
