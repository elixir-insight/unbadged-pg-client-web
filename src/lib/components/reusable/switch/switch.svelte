<script lang="ts">
	import { Switch as UISwitch } from '$lib/components/ui/switch';

	let {
		checked = $bindable(false),
		size = 'default' as 'sm' | 'default',
		disabled = false,
		class: className,
		onCheckedChange
	}: {
		checked?: boolean;
		size?: 'sm' | 'default';
		disabled?: boolean;
		class?: string;
		onCheckedChange?: (checked: boolean) => void;
	} = $props();
</script>

<UISwitch bind:checked {size} {disabled} class={className} {onCheckedChange} />
