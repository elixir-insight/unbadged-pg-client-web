<script lang="ts">
	import { Users } from '$lib/assets/icons';
	import { cn } from '$lib/utils';
	import type { RoleItem } from '$lib/stores/role-management/role-management';

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
		{ bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
		{ bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30' },
		{ bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
		{ bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
		{ bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
		{ bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
		{ bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
		{ bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' }
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
		'group/card flex w-full flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-md shadow',
		selected ? 'border-primary bg-primary/5' : 'border-border'
	)}
>
	<!-- Clickable top section: icon + name -->
	<button
		class="flex cursor-pointer flex-col gap-3 p-4 text-left h-full shadow"
		{onclick}
		tabindex="0"
	>
		<!-- Icon row + type badge -->
		<div class="flex items-start justify-between">
			<div class="flex gap-4 items-center">
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
				<p class="text-sm font-semibold leading-tight text-foreground">{displayName}</p>
			</div>

			<span
				class={cn(
					'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow',
					role.defaultRole
						? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
						: 'border-primary/30 bg-primary/10 text-primary'
				)}
			>
				{role.defaultRole ? 'Default' : 'Custom'}
			</span>
		</div>

		<!-- Description -->
		<p class="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{role.description}</p>
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
