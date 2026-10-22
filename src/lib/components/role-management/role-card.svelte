<script lang="ts">
	import { Users } from '$lib/assets/icons';
	import { Chip } from '$lib/components/reusable';
	import type { BadgeVariant } from '$lib/components/ui/badge';
	import { cn } from '$lib/utils';
	import type { RoleItem } from '$lib/stores/role-management/role-management';

	function roleBadgeVariant(defaultRole: boolean): BadgeVariant {
		return defaultRole ? 'alert' : 'info';
	}

	let {
		role,
		selected = false,
		onclick
	}: {
		role: RoleItem;
		selected?: boolean;
		onclick?: () => void;
	} = $props();

	const ICON_COLORS = [
		{ bg: 'bg-chart-1/20', text: 'text-chart-1', border: 'border-chart-1/30' },
		{ bg: 'bg-chart-2/20', text: 'text-chart-2', border: 'border-chart-2/30' },
		{ bg: 'bg-success/20', text: 'text-success', border: 'border-success/30' },
		{ bg: 'bg-warning/20', text: 'text-warning', border: 'border-warning/30' },
		{ bg: 'bg-destructive/20', text: 'text-destructive', border: 'border-destructive/30' },
		{ bg: 'bg-chart-3/20', text: 'text-chart-3', border: 'border-chart-3/30' },
		{ bg: 'bg-chart-4/20', text: 'text-chart-4', border: 'border-chart-4/30' },
		{ bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary/30' }
	];

	const colorIndex = $derived(role.roleId % ICON_COLORS.length);
	const color = $derived(ICON_COLORS[colorIndex]);

	// Format SCREAMING_SNAKE_CASE → Title Case for display
	const displayName = $derived(
		role.roleName
			.split('_')
			.map((w) => w.charAt(0) + w.slice(1).toLowerCase())
			.join(' ')
	);
</script>

<div
	id={String(role.roleId)}
	class={cn(
		'group/card flex w-full flex-col overflow-hidden rounded-xl border bg-card shadow transition-all duration-200 hover:border-primary/40 hover:shadow-md',
		selected ? 'border-primary bg-primary/5' : 'border-border'
	)}
>
	<!-- Clickable top section: icon + name -->
	<button class="flex h-full cursor-pointer flex-col gap-3 p-4 text-left" {onclick} tabindex="0">
		<!-- Icon row + type badge -->
		<div class="flex items-start justify-between">
			<div class="flex items-center gap-4">
				<div
					class={cn(
						'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border shadow',
						color.bg,
						color.border
					)}
				>
					<Users class={cn('h-5 w-5', color.text)} />
				</div>

				<!-- Name -->
				<p class="text-sm leading-tight font-semibold text-foreground">{displayName}</p>
			</div>

			<Chip variant={roleBadgeVariant(role.defaultRole)} class="text-[10px] tracking-wide">
				{role.defaultRole ? 'Default' : 'Custom'}
			</Chip>
		</div>

		<!-- Description -->
		<p class="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{role.description}</p>
	</button>

	<!-- Divider -->
	<div class="border-t border-border"></div>

	<!-- Bottom section -->
	<div class="flex items-center justify-between px-4 py-3">
		<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
			<Users class="h-3.5 w-3.5" />
			<span>{role.roleAssignedCount} {role.roleAssignedCount === 1 ? 'Member' : 'Members'}</span>
		</div>
	</div>
</div>
