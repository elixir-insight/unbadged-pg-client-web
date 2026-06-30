<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { cn } from '$lib/utils';
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { ChevronLeftIcon } from '$lib/assets/icons';

	type Mode = 'manual' | 'surepass';

	interface ModeConfig {
		icon: string;
		title: string;
		description: string;
		cta: string;
		gradient: string;
		gradientDark: string;
		border: string;
		ctaClass: string;
		iconBg: string;
		accentText: string;
		features: readonly string[];
	}

	interface Props {
		selected: Mode;
		direction: number;
		current: ModeConfig;
		onSelectMode: (mode: Mode) => void;
		onStartManual: () => void;
	}

	let { selected, direction, current, onSelectMode, onStartManual }: Props = $props();
</script>

<div
	class="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-10"
	in:fade={{ duration: 200 }}
>
	<div class="w-full max-w-xl">
		<button
			onclick={() => goto(resolve('/management/onboarding'))}
			class="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
		>
			<ChevronLeftIcon class="size-4" />
			Back to Onboarding
		</button>

		<div class="mb-8 text-center" in:fly={{ y: -10, duration: 300, easing: cubicOut }}>
			<h1 class="text-3xl font-bold tracking-tight">Choose Onboarding Mode</h1>
			<p class="mt-2 text-sm text-muted-foreground">
				Select how you'd like to onboard this organization.
			</p>
		</div>

		<div
			class="mb-8 overflow-x-auto"
			in:fly={{ y: -6, duration: 300, delay: 60, easing: cubicOut }}
		>
			<div
				class="relative mx-auto flex w-fit min-w-max rounded-full border border-border/60 bg-muted/40 p-1 shadow-inner backdrop-blur-sm"
			>
				<div
					class={cn(
						'toggle-indicator absolute top-1 bottom-1 rounded-full transition-all duration-300',
						selected === 'manual'
							? 'left-1 w-[calc(50%-2px)] bg-chart-2 shadow-md shadow-chart-2/30'
							: 'left-[calc(50%+2px)] w-[calc(50%-4px)] bg-primary shadow-md shadow-primary/30'
					)}
					aria-hidden="true"
				></div>

				<button
					onclick={() => onSelectMode('manual')}
					class={cn(
						'relative z-10 flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-200',
						selected === 'manual' ? 'text-white' : 'text-muted-foreground hover:text-foreground'
					)}
				>
					<span>📋</span>
					Manual Onboarding
				</button>
				<button
					onclick={() => onSelectMode('surepass')}
					class={cn(
						'relative z-10 flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-200',
						selected === 'surepass' ? 'text-white' : 'text-muted-foreground hover:text-foreground'
					)}
				>
					<span class="pl-2">⚡</span>
					KYC Onboarding
				</button>
			</div>
		</div>

		<div class={cn('card-border-wrap', selected === 'surepass' ? 'border-kyc' : 'border-manual')}>
			<div class="grid overflow-hidden rounded-[22px]">
				{#key selected}
					<div
						class="card-inner-bg relative overflow-hidden rounded-[22px] p-8 shadow-xl transition-all duration-500 [grid-area:1/1]"
						in:fly={{ x: direction * 40, duration: 320, easing: cubicOut }}
						out:fly={{ x: -direction * 40, duration: 200, easing: cubicOut }}
					>
						<!-- Colored gradient tint overlay on top of glass base -->
						<div
							class={cn(
								'pointer-events-none absolute inset-0 bg-linear-to-br',
								current.gradient,
								current.gradientDark
							)}
							aria-hidden="true"
						></div>

						<div
							class={cn(
								'pointer-events-none absolute -top-16 -right-16 size-48 rounded-full opacity-40 blur-3xl',
								selected === 'manual' ? 'bg-chart-2/60' : 'bg-primary/60'
							)}
							aria-hidden="true"
						></div>

						<div class="card-shine pointer-events-none absolute inset-0" aria-hidden="true"></div>

						<div class="relative z-10">
							<div
								class={cn(
									'mb-5 flex size-16 items-center justify-center rounded-2xl text-3xl',
									current.iconBg
								)}
							>
								{current.icon}
							</div>

							<h2 class="text-2xl font-bold tracking-tight">{current.title}</h2>
							<p class="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
								{current.description}
							</p>

							<div class="mt-5 flex flex-wrap gap-2">
								{#each current.features as feature (feature)}
									<span
										class={cn(
											'rounded-full border px-3 py-1 text-xs font-medium',
											current.border,
											current.accentText,
											'bg-white/50 dark:bg-black/20'
										)}
									>
										{feature}
									</span>
								{/each}
							</div>

							{#if selected === 'manual'}
								<button
									onclick={onStartManual}
									class={cn(
										'cta-btn mt-7 flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold transition-all duration-200',
										'hover:-translate-y-0.5 active:translate-y-0',
										current.ctaClass
									)}
								>
									{current.cta}
									<svg
										class="size-4"
										viewBox="0 0 16 16"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M3 8h10M9 4l4 4-4 4"
											stroke="currentColor"
											stroke-width="1.5"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
								</button>
							{:else}
								<button
									// onclick={() => goto(resolve('/management/onboarding/surepass'))}
									class={cn(
										'cta-btn mt-7 flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold transition-all duration-200',
										'hover:-translate-y-0.5 active:translate-y-0',
										current.ctaClass
									)}
								>
									{current.cta}
									<svg
										class="size-4"
										viewBox="0 0 16 16"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M3 8h10M9 4l4 4-4 4"
											stroke="currentColor"
											stroke-width="1.5"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
								</button>
							{/if}
						</div>
					</div>
				{/key}
			</div>
		</div>

		<p
			class="mt-6 text-center text-xs text-muted-foreground/60"
			in:fade={{ duration: 400, delay: 300 }}
		>
			Both flows are fully compliant with RBI KYC/KYB requirements.
		</p>
	</div>
</div>

<style>
	@keyframes shine-sweep {
		0% {
			transform: translateX(-100%) skewX(-15deg);
			opacity: 0;
		}
		20% {
			opacity: 1;
		}
		80% {
			opacity: 0.5;
		}
		100% {
			transform: translateX(200%) skewX(-15deg);
			opacity: 0;
		}
	}

	.card-shine {
		background: linear-gradient(
			105deg,
			transparent 20%,
			rgba(255, 255, 255, 0.08) 40%,
			rgba(255, 255, 255, 0.16) 50%,
			rgba(255, 255, 255, 0.08) 60%,
			transparent 80%
		);
		animation: shine-sweep 0.7s ease-out forwards;
	}

	@keyframes cta-shine {
		0% {
			transform: translateX(-100%) skewX(-20deg);
		}
		100% {
			transform: translateX(300%) skewX(-20deg);
		}
	}

	.cta-btn {
		position: relative;
		overflow: hidden;
	}

	.cta-btn::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 40%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
		animation: cta-shine 1.2s ease-out 0.4s forwards;
	}

	.cta-btn:hover::after {
		animation: cta-shine 0.8s ease-out forwards;
	}

	.toggle-indicator {
		will-change: left, width;
	}

	/* ── Animated border card ───────────────────────────── */
	@property --border-angle {
		syntax: '<angle>';
		initial-value: 0deg;
		inherits: false;
	}

	@keyframes spin-border {
		to {
			--border-angle: 360deg;
		}
	}

	.card-border-wrap {
		position: relative;
		border-radius: 1.5rem;
		padding: 2px;
		animation: spin-border 4s linear infinite;
	}

	.card-border-wrap.border-manual {
		background: conic-gradient(
			from var(--border-angle),
			transparent 65%,
			oklch(0.75 0.18 170 / 0.9) 78%,
			oklch(0.85 0.2 195 / 1) 85%,
			oklch(0.75 0.18 150 / 0.9) 92%,
			transparent
		);
	}

	.card-border-wrap.border-kyc {
		background: conic-gradient(
			from var(--border-angle),
			transparent 65%,
			oklch(0.6 0.22 260 / 0.9) 78%,
			oklch(0.75 0.18 300 / 1) 85%,
			oklch(0.65 0.22 240 / 0.9) 92%,
			transparent
		);
	}

	.card-inner-bg {
		background-color: oklch(0.97 0.008 250 / 0.97);
	}

	:global(.dark) .card-inner-bg {
		background-color: oklch(0.12 0.045 265 / 0.98);
	}
</style>
