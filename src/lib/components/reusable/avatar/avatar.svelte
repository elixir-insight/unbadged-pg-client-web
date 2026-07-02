<script lang="ts" module>
	export interface AvatarProps {
		name: string;
		src?: string;
		size?: 'sm' | 'default' | 'lg';
		shape?: 'circle' | 'square';
		class?: string;
	}
</script>

<script lang="ts">
	import * as AvatarUI from '$lib/components/ui/avatar';
	import { cn } from '$lib/utils';

	let { name, src, size = 'default', shape = 'square', class: className }: AvatarProps = $props();

	const isSquare = $derived(shape === 'square');

	function initials(n: string) {
		return n
			.split(' ')
			.map((w) => w[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}
</script>

<div class={cn('flex items-center gap-2.5', className)}>
	<AvatarUI.Avatar {size} class={cn(isSquare && 'rounded-md after:rounded-md')}>
		{#if src}
			<AvatarUI.AvatarImage {src} alt={name} />
		{/if}
		<AvatarUI.AvatarFallback
			class={cn('bg-primary/10 text-xs font-semibold text-primary', isSquare && 'rounded-md')}
		>
			{initials(name)}
		</AvatarUI.AvatarFallback>
	</AvatarUI.Avatar>
</div>
