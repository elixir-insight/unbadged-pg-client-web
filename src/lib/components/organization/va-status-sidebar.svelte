<script lang="ts">
	import {
		Button,
		Chip,
		Dropdown,
		VA_STATUSES,
		vaStatusChipVariant,
		type VAStatus
	} from '$lib/components/reusable';
	import { ActivityIcon } from '$lib/assets/icons';
	import { cn } from '$lib/utils';
	import { enumToDropdownOptions, formatStatusLabel } from '$lib/utils/status_rename';

	const VA_STATUS_OPTIONS = enumToDropdownOptions(VA_STATUSES);

	let {
		vaNo,
		status = $bindable<VAStatus>('ACTIVE'),
		onUpdateStatus
	}: {
		vaNo: string;
		status?: VAStatus;
		onUpdateStatus?: () => void;
	} = $props();

	let pendingStatus = $derived<VAStatus>(status);

	$effect(() => {
		pendingStatus = status;
	});

	function handleUpdateStatus() {
		status = pendingStatus;
		onUpdateStatus?.();
	}

	const statusVariant = $derived(vaStatusChipVariant[status]);
	const statusLabel = $derived(formatStatusLabel(status));
</script>

<section
	class="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/40 transition-shadow duration-200 hover:shadow-md"
>
	<div class="relative overflow-hidden px-4 py-3.5">
		<div class="gradient-soft absolute inset-0 opacity-50"></div>
		<div class="absolute inset-y-0 left-0 w-0.5 rounded-full bg-success/50"></div>
		<div class="relative flex items-center gap-2.5">
			<div
				class={cn(
					'flex size-7 shrink-0 items-center justify-center rounded-lg shadow-xs ring-1',
					'bg-success/10 text-success ring-success/15'
				)}
			>
				<ActivityIcon class="size-3.5" />
			</div>
			<div class="min-w-0">
				<p class="text-sm font-semibold tracking-tight">VA Status</p>
				<p class="truncate text-xs text-muted-foreground/80">{vaNo}</p>
			</div>
		</div>
	</div>

	<div class="space-y-4 border-t border-border/40 p-4">
		<div class="space-y-2">
			<span class="block text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase">
				Current Status
			</span>
			<Chip variant={statusVariant}>{statusLabel}</Chip>
		</div>

		<div class="space-y-1.5">
			<span class="block text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase">
				Update Status
			</span>
			<Dropdown
				bind:value={pendingStatus}
				options={VA_STATUS_OPTIONS}
				placeholder="Select status…"
				name="va-status"
			/>
		</div>

		<Button class="gradient-primary w-full text-primary-foreground" onclick={handleUpdateStatus}>
			Update VA Status
		</Button>
	</div>
</section>
