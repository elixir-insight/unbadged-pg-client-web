<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		length = 6,
		value = $bindable(''),
		error = '',
		disabled = false,
		visualState = 'default',
		shakeKey = 0,
		onComplete
	}: {
		length?: number;
		value?: string;
		error?: string;
		disabled?: boolean;
		visualState?: 'default' | 'success' | 'error';
		shakeKey?: number;
		onComplete?: (code: string) => void;
	} = $props();

	let inputs: HTMLInputElement[] = $state([]);
	let shaking = $state(false);

	const digits = $derived(value.padEnd(length, ' ').split('').slice(0, length));

	$effect(() => {
		if (shakeKey > 0) {
			shaking = true;
			const timer = setTimeout(() => {
				shaking = false;
			}, 450);
			return () => clearTimeout(timer);
		}
	});

	function focusInput(index: number) {
		if (disabled) return;
		const target = inputs[index];
		target?.focus();
		target?.select();
	}

	function updateValue(nextDigits: string[]) {
		value = nextDigits.join('').replace(/\s/g, '');
		if (!disabled && value.length === length && /^\d+$/.test(value)) {
			onComplete?.(value);
		}
	}

	function handleInput(index: number, event: Event) {
		if (disabled) return;
		const target = event.currentTarget as HTMLInputElement;
		const digit = target.value.replace(/\D/g, '').slice(-1);
		const next = [...digits.map((d) => (d === ' ' ? '' : d))];
		next[index] = digit;
		updateValue(next);

		if (digit && index < length - 1) {
			focusInput(index + 1);
		}
	}

	function handleKeyDown(index: number, event: KeyboardEvent) {
		if (disabled) return;
		const current = digits[index]?.trim() ?? '';

		if (event.key === 'Backspace' && !current && index > 0) {
			event.preventDefault();
			const next = [...digits.map((d) => (d === ' ' ? '' : d))];
			next[index - 1] = '';
			updateValue(next);
			focusInput(index - 1);
			return;
		}

		if (event.key === 'ArrowLeft' && index > 0) {
			event.preventDefault();
			focusInput(index - 1);
		}

		if (event.key === 'ArrowRight' && index < length - 1) {
			event.preventDefault();
			focusInput(index + 1);
		}
	}

	function handlePaste(event: ClipboardEvent) {
		if (disabled) return;
		event.preventDefault();
		const pasted = event.clipboardData?.getData('text') ?? '';
		const clean = pasted.replace(/\D/g, '').slice(0, length);
		if (!clean) return;

		const next = Array.from({ length }, (_, i) => clean[i] ?? '');
		updateValue(next);

		const focusIndex = Math.min(clean.length, length - 1);
		focusInput(focusIndex);
	}

	const boxClass = $derived.by(() => {
		if (visualState === 'success') {
			return 'border-primary bg-primary/10 text-primary';
		}
		if (visualState === 'error') {
			return 'border-destructive bg-destructive/5 text-destructive';
		}
		return 'border-input bg-background text-foreground';
	});
</script>

<div class="space-y-2">
	<div
		class={cn('flex justify-center gap-2 sm:gap-2.5 lg:gap-3', shaking && 'otp-shake')}
		role="group"
		aria-label="One-time password"
	>
		{#each Array.from({ length }, (_, index) => index) as index (index)}
			<input
				bind:this={inputs[index]}
				type="text"
				inputmode="numeric"
				autocomplete="one-time-code"
				maxlength={1}
				{disabled}
				class={cn(
					'size-11 rounded-md border text-center text-lg font-semibold shadow-xs transition-colors sm:size-12 sm:text-xl lg:size-14',
					'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
					disabled && 'cursor-not-allowed opacity-80',
					boxClass,
					error && visualState === 'default' && 'border-destructive'
				)}
				value={digits[index]?.trim() ?? ''}
				aria-invalid={Boolean(error)}
				aria-label="Digit {index + 1} of {length}"
				oninput={(event) => handleInput(index, event)}
				onkeydown={(event) => handleKeyDown(index, event)}
				onpaste={handlePaste}
			/>
		{/each}
	</div>

	{#if error && visualState === 'default'}
		<p class="text-center text-sm text-destructive" role="alert">{error}</p>
	{/if}
</div>

<style>
	@keyframes otp-shake {
		0%,
		100% {
			transform: translateX(0);
		}
		20%,
		60% {
			transform: translateX(-5px);
		}
		40%,
		80% {
			transform: translateX(5px);
		}
	}

	:global(.otp-shake) {
		animation: otp-shake 0.45s ease-in-out;
	}
</style>
