<script module lang="ts">
	export interface RadialSpiralSegment {
		label: string;
		value: number;
		color: string;
		/** Ring radius in px. Auto-spaced from the outer ring when omitted. */
		radius?: number;
	}
</script>

<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { cn } from '$lib/utils';

	interface Props {
		segments?: RadialSpiralSegment[];
		total?: number;
		unitLabel?: string;
		size?: number;
		strokeWidth?: number;
		class?: string;
	}

	let {
		segments = [],
		total,
		unitLabel = '',
		size = 176,
		strokeWidth = 10,
		class: className
	}: Props = $props();

	const center = $derived(size / 2);
	const maxRadius = $derived(center - strokeWidth);
	const computedTotal = $derived(total ?? segments.reduce((sum, s) => sum + s.value, 0));

	function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
		const rad = ((angleDeg - 90) * Math.PI) / 180;
		return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
	}

	// Describes a clockwise arc starting at 12 o'clock, sweeping `sweepDeg` degrees.
	function describeArc(cx: number, cy: number, r: number, sweepDeg: number) {
		const clamped = Math.min(Math.max(sweepDeg, 0.001), 359.999);
		const start = polarToCartesian(cx, cy, r, 0);
		const end = polarToCartesian(cx, cy, r, clamped);
		const largeArcFlag = clamped > 180 ? 1 : 0;
		return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
	}

	const arcs = $derived(
		segments.map((s, i) => {
			const r = s.radius ?? maxRadius - i * (strokeWidth * 1.6);
			const sweep = computedTotal ? (s.value / computedTotal) * 360 : 0;
			return {
				...s,
				percent: computedTotal ? Math.round((s.value / computedTotal) * 100) : 0,
				path: describeArc(center, center, r, sweep),
				trackPath: describeArc(center, center, r, 359.999)
			};
		})
	);

	// Wider than the visible ring so the pointer doesn't have to land exactly on the stroke.
	const hitStrokeWidth = $derived(strokeWidth + 14);
</script>

<Tooltip.Provider delayDuration={100}>
	<div class={cn('flex h-full flex-col items-center gap-3 md:flex-row md:gap-6', className)}>
		<div
			class="relative aspect-square h-full min-h-28 w-auto min-w-28 shrink-0"
			style="max-width:{size}px; max-height:{size}px;"
		>
			<svg viewBox="0 0 {size} {size}" class="h-full w-full overflow-visible">
				{#each arcs as arc (arc.label)}
					<g class="spiral-ring">
						<path
							d={arc.trackPath}
							fill="none"
							stroke={arc.color}
							opacity="0.16"
							stroke-width={strokeWidth}
							stroke-linecap="round"
						/>
						<path
							d={arc.path}
							class="spiral-ring-value"
							fill="none"
							stroke={arc.color}
							stroke-width={strokeWidth}
							stroke-linecap="round"
						/>
						<Tooltip.Root>
							<Tooltip.Trigger>
								{#snippet child({ props })}
									<path
										{...props}
										d={arc.trackPath}
										fill="none"
										stroke="transparent"
										stroke-width={hitStrokeWidth}
										class="spiral-ring-hit"
										aria-label="{arc.label}: {arc.value} {unitLabel} ({arc.percent}%)"
									/>
								{/snippet}
							</Tooltip.Trigger>
							<Tooltip.Content side="top">
								<span class="font-semibold">{arc.label}</span>
								<span class="text-background/70">· {arc.value} ({arc.percent}%)</span>
							</Tooltip.Content>
						</Tooltip.Root>
					</g>
				{/each}
			</svg>

			<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
				<span class="font-mono text-2xl font-semibold tabular-nums text-foreground">
					{computedTotal}
				</span>
				{#if unitLabel}
					<span class="text-[12px] font-medium text-muted-foreground">{unitLabel}</span>
				{/if}
			</div>
		</div>

		<ul class="flex flex-1 flex-col gap-3">
			{#each arcs as arc (arc.label)}
				<li>
					<Tooltip.Root>
						<Tooltip.Trigger class="flex w-full cursor-default items-center gap-2.5 text-[13.5px]">
							<span class="size-2.5 shrink-0 rounded-full" style="background-color:{arc.color}"
							></span>
							<span class="text-muted-foreground">{arc.label}</span>
							<span
								class="ml-auto font-mono text-[13.5px] font-semibold tabular-nums text-foreground"
							>
								{arc.value}
							</span>
						</Tooltip.Trigger>
						<Tooltip.Content side="top">
							{arc.percent}% of {computedTotal}
							{unitLabel}
						</Tooltip.Content>
					</Tooltip.Root>
				</li>
			{/each}
		</ul>
	</div>
</Tooltip.Provider>

<style>
	.spiral-ring-hit {
		cursor: pointer;
		outline: none;
	}

	.spiral-ring-value {
		transition: filter 150ms ease;
	}

	.spiral-ring:hover .spiral-ring-value,
	.spiral-ring:focus-within .spiral-ring-value {
		filter: brightness(1.15);
	}
</style>
