<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox, Input } from '$lib/components/reusable';
	import { theme } from '$lib/stores/theme.svelte';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import type { Snippet } from 'svelte';

	let email = $state('');
	let password = $state('');
	let rememberMe = $state(false);
	let showPassword = $state(false);
	let leftPanel: HTMLDivElement | null = $state(null);
	let rotX = $state(0);
	let rotY = $state(0);
	let glowX = $state(50);
	let glowY = $state(50);
	let isHovered = $state(false);

	let { children }: { children?: Snippet } = $props();

	function onPanelMouseMove(e: MouseEvent) {
		if (!leftPanel) return;
		const rect = leftPanel.getBoundingClientRect();
		const dx = (e.clientX - rect.left) / rect.width - 0.5;
		const dy = (e.clientY - rect.top) / rect.height - 0.5;
		rotY = dx * 38;
		rotX = -dy * 28;
		glowX = ((e.clientX - rect.left) / rect.width) * 100;
		glowY = ((e.clientY - rect.top) / rect.height) * 100;
		isHovered = true;
	}

	function onPanelMouseLeave() {
		rotX = 0;
		rotY = 0;
		glowX = 50;
		glowY = 50;
		isHovered = false;
	}

	onMount(() => {
		theme.init();
	});
</script>

<div class="flex h-screen w-full gap-3 overflow-hidden p-4">
	<!-- Left Panel -->
	<div
		class="relative h-full w-[50%] shadow"
		role="presentation"
		bind:this={leftPanel}
		onmousemove={onPanelMouseMove}
		onmouseleave={onPanelMouseLeave}
	>
		<div class="blob-container relative h-full">
			<div class="blob blob1"></div>
			<div class="blob blob2"></div>
			<div class="blob blob3"></div>
			{@render children?.()}

			<!-- Parallax glass card stack -->
			<div class="absolute inset-0 flex items-center justify-center overflow-visible">
				<div
					class="card-scene"
					style:transform="perspective(900px) rotateX({rotX}deg) rotateY({rotY}deg)"
					style:transition={isHovered
						? 'transform 0.0001s linear'
						: 'transform 0.008s cubic-bezier(0.23, 1, 0.32, 1)'}
				>
					<!-- Back card — more translucent, offset & tilted -->
					<div class="glass-card glass-card--back">
						<div class="card-inner">
							<div class="flex items-start justify-between">
								<p class="text-[10px] font-medium tracking-[0.2em] uppercase opacity-60">
									Debit Card
								</p>
								<div class="card-network-mark" aria-hidden="true">
									<span class="card-network-circle"></span>
									<span class="card-network-circle card-network-circle--right"></span>
								</div>
							</div>

							<div class="mt-auto space-y-3">
								<p class="font-mono text-sm tracking-[0.3em] opacity-70">
									5412&nbsp;&nbsp;7534&nbsp;&nbsp;9821&nbsp;&nbsp;4067
								</p>
								<div class="flex items-end justify-between">
									<div>
										<p class="text-[9px] tracking-widest uppercase opacity-40">Card Holder</p>
										<p class="text-sm font-medium opacity-80">Jane Smith</p>
									</div>
									<div class="text-right">
										<p class="text-[9px] tracking-widest uppercase opacity-40">Expires</p>
										<p class="text-sm font-medium opacity-80">09/2027</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Front card — primary glass layer -->
					<div class="glass-card glass-card--front">
						<div
							class="card-shine"
							style:background="radial-gradient(ellipse at {glowX}% {glowY}%, color-mix(in oklch,
							var(--primary-foreground) 22%, transparent) 0%, transparent 70%)"
						></div>

						<div class="card-inner">
							<div class="flex items-start justify-between">
								<div>
									<p class="text-[10px] font-medium tracking-[0.2em] uppercase opacity-60">
										Credit Card
									</p>
								</div>
								<div class="card-network-mark" aria-hidden="true">
									<span class="card-network-circle"></span>
									<span class="card-network-circle card-network-circle--right"></span>
								</div>
							</div>

							<div class="mt-auto space-y-3">
								<p class="font-mono text-sm tracking-[0.3em] opacity-80">
									4323&nbsp;&nbsp;7645&nbsp;&nbsp;2828&nbsp;&nbsp;0713
								</p>
								<div class="flex items-end justify-between">
									<div>
										<p class="text-[9px] tracking-widest uppercase opacity-40">Card Holder</p>
										<p class="text-sm font-medium opacity-90">John Doe</p>
									</div>
									<div class="text-right">
										<p class="text-[9px] tracking-widest uppercase opacity-40">Expires</p>
										<p class="text-sm font-medium opacity-90">12/2028</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Right Panel -->
	<div class="relative flex w-[50%] flex-1 flex-col bg-background">
		<main class="flex flex-1 items-center justify-center px-10">
			<div class="w-full max-w-md">
				<div class="mb-8 space-y-2">
					<h1 class="text-4xl font-bold tracking-tight text-foreground">Welcome to ElixirPay!</h1>
					<p class="text-base text-muted-foreground">
						Enter your login details to access your dashboard
					</p>
				</div>

				<form class="space-y-5" onsubmit={(e) => e.preventDefault()}>
					<div class="space-y-2">
						<label class="text-sm font-semibold text-foreground" for="email">Email</label>
						<Input
							id="email"
							type="email"
							placeholder="Enter the email"
							bind:value={email}
							class="h-11"
						/>
					</div>

					<div class="space-y-2">
						<label class="text-sm font-semibold text-foreground" for="password">Password</label>
						<div class="relative">
							<Input
								id="password"
								type={showPassword ? 'text' : 'password'}
								placeholder="Enter the password"
								bind:value={password}
								class="h-11 pr-11"
							/>
							<button
								type="button"
								onclick={() => (showPassword = !showPassword)}
								class="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
								aria-label={showPassword ? 'Hide password' : 'Show password'}
							>
								{#if showPassword}
									<EyeOff class="h-4 w-4" />
								{:else}
									<Eye class="h-4 w-4" />
								{/if}
							</button>
						</div>
					</div>

					<div class="flex items-center justify-between">
						<Checkbox
							id="remember"
							label="Remember me"
							bind:checked={rememberMe}
							class="items-center **:data-[slot=checkbox]:mt-0"
						/>
						<a href={resolve('/login')} class="text-sm font-medium text-primary hover:underline">
							Forgot password?
						</a>
					</div>

					<Button type="submit" class="h-11 w-full text-base">Login</Button>
				</form>
			</div>
		</main>

		<footer class="px-10 pb-8 text-center text-sm text-muted-foreground">
			<a href={resolve('/login')} class="underline underline-offset-4 hover:text-foreground">
				Terms and Conditions
			</a>
			<span class="mx-3 text-border" aria-hidden="true">|</span>
			<a href={resolve('/login')} class="underline underline-offset-4 hover:text-foreground">
				Privacy Policy
			</a>
		</footer>
	</div>
</div>

<style>
	.card-scene {
		position: relative;
		width: 26rem;
		height: 19.5rem;
		transform-style: preserve-3d;
		overflow: visible;
	}

	.glass-card {
		position: absolute;
		width: 24rem;
		height: 13rem;
		border-radius: 1rem;
		overflow: hidden;
		backdrop-filter: blur(18px);
		-webkit-backdrop-filter: blur(18px);
		background: color-mix(in oklch, var(--primary-foreground) 10%, transparent);
		border: 1px solid color-mix(in oklch, var(--primary-foreground) 22%, transparent);
		box-shadow:
			var(--shadow-lg),
			0 1.25rem 2.5rem color-mix(in oklch, var(--primary) 18%, transparent);
		color: var(--primary-foreground);
		will-change: transform;
	}

	.glass-card--back {
		top: 0;
		left: 2.5rem;
		transform: rotate(8deg);
		background: color-mix(in oklch, var(--primary-foreground) 6%, transparent);
		border-color: color-mix(in oklch, var(--primary-foreground) 14%, transparent);
		z-index: 1;
		animation: float-back 5.5s ease-in-out infinite;
	}

	.glass-card--front {
		top: 6.5rem;
		left: 0;
		z-index: 2;
		animation: float-front 4.5s ease-in-out infinite;
		animation-delay: -1.2s;
	}

	@keyframes float-back {
		0%,
		100% {
			transform: rotate(8deg) translateY(0);
			box-shadow:
				var(--shadow-lg),
				0 1rem 2rem color-mix(in oklch, var(--primary) 14%, transparent);
		}

		50% {
			transform: rotate(8deg) translateY(-0.75rem);
			box-shadow:
				var(--shadow-xl),
				0 1.75rem 3rem color-mix(in oklch, var(--primary) 22%, transparent);
		}
	}

	@keyframes float-front {
		0%,
		100% {
			transform: translateY(0);
			box-shadow:
				var(--shadow-lg),
				0 1.25rem 2.5rem color-mix(in oklch, var(--primary) 18%, transparent);
		}

		50% {
			transform: translateY(-0.625rem);
			box-shadow:
				var(--shadow-xl),
				0 2rem 3.5rem color-mix(in oklch, var(--primary) 26%, transparent);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.glass-card--back,
		.glass-card--front {
			animation: none;
		}
	}

	.card-inner {
		position: relative;
		z-index: 1;
		display: flex;
		height: 100%;
		flex-direction: column;
		padding: 1.5rem;
	}

	.card-shine {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 0;
	}

	.card-network-mark {
		position: relative;
		width: 2.25rem;
		height: 1.375rem;
		flex-shrink: 0;
	}

	.card-network-circle {
		position: absolute;
		top: 0;
		left: 0;
		width: 1.375rem;
		height: 1.375rem;
		border-radius: 9999px;
		border: 1.5px solid color-mix(in oklch, var(--primary-foreground) 60%, transparent);
		background: color-mix(in oklch, var(--primary-foreground) 10%, transparent);
	}

	.card-network-circle--right {
		left: 0.75rem;
	}

	.blob-container {
		position: relative;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			145deg,
			color-mix(in oklch, var(--chart-5), var(--primary) 35%) 0%,
			var(--primary) 45%,
			color-mix(in oklch, var(--primary), var(--chart-3) 40%) 100%
		);
		overflow: hidden;
		border-radius: 1rem;
	}

	.blob {
		position: absolute;
		border-radius: 50%;
		filter: blur(60px);
		opacity: 0.7;
		animation: morph 10s ease-in-out infinite;
	}

	.blob1 {
		width: 400px;
		height: 400px;
		background: radial-gradient(
			circle,
			color-mix(in oklch, var(--chart-5), white 50%),
			color-mix(in oklch, var(--primary), black 20%)
		);
		top: -100px;
		right: -50px;
		animation-delay: 4s;
	}

	.blob2 {
		width: 300px;
		height: 300px;
		background: radial-gradient(
			circle,
			color-mix(in oklch, var(--chart-5), white 75%),
			var(--primary)
		);
		bottom: 100px;
		left: -50px;
		animation-delay: -4s;
	}

	.blob3 {
		width: 250px;
		height: 250px;
		background: radial-gradient(
			circle,
			color-mix(in oklch, var(--chart-5), white 55%),
			color-mix(in oklch, var(--primary), black 10%)
		);
		bottom: -50px;
		right: 100px;
		animation-delay: -7s;
	}

	@keyframes morph {
		0%,
		100% {
			border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
			transform: translate(100px, 100px);
		}
		33% {
			border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
			transform: translate(100px, -100px);
		}
		66% {
			border-radius: 50% 60% 30% 60% / 30% 60% 70% 40%;
			transform: translate(-150px, 150px);
		}
	}
</style>
