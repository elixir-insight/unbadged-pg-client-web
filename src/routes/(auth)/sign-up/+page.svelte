<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import {
		Input,
		PhoneInput,
		PasswordChecklist,
		CardSelect,
		toast,
		type CardSelectOption
	} from '$lib/components/reusable';
	import AuthFormShell from '$lib/components/auth/auth-form-shell.svelte';
	import { Eye, EyeOff } from '$lib/assets/icons';
	import {
		SIGN_UP_BUSINESS_TYPES,
		firstInvalidSignUpField,
		isSignUpFormValid,
		validateSignUp,
		validateSignUpField,
		type SignUpBusinessType,
		type SignUpField,
		type SignUpInput
	} from '$lib/validation/sign-up';

	let { form }: PageProps = $props();

	const BUSINESS_TYPE_DISPLAY_ORDER: SignUpBusinessType[] = [
		'SOLE_PROPRIETORSHIP',
		'PRIVATE_LIMITED',
		'LIMITED_LIABILITY_PARTNERSHIP',
		'PARTNERSHIP'
	];
	const businessTypeOptions: CardSelectOption[] = BUSINESS_TYPE_DISPLAY_ORDER.map((value) => {
		const option = SIGN_UP_BUSINESS_TYPES.find((o) => o.value === value)!;
		return {
			value: option.value,
			label: option.label
		};
	});

	let legalCompanyName = $state('');
	let businessType = $state('');
	let userEmail = $state('');
	let phoneNumber = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let submitting = $state(false);
	let formError = $state<string | null>(null);
	let fieldErrors = $state<Partial<Record<SignUpField, string>>>({});
	let touched = $state<Partial<Record<SignUpField, boolean>>>({});
	let focusedField = $state<SignUpField | null>(null);

	const values: SignUpInput = $derived({
		legalCompanyName,
		businessType,
		userEmail,
		phoneNumber,
		password,
		affiliateId: ''
	});
	const isFormValid = $derived(isSignUpFormValid(values));

	$effect(() => {
		if (!form) return;
		if (form.legalCompanyName !== undefined) legalCompanyName = form.legalCompanyName;
		if (form.businessType !== undefined) businessType = form.businessType;
		if (form.userEmail !== undefined) userEmail = form.userEmail.trim().toLowerCase();
		if (form.phoneNumber !== undefined) phoneNumber = form.phoneNumber;

		const errors = form.errors ?? {};
		fieldErrors = errors;
		touched = {
			...untrack(() => touched),
			...Object.fromEntries(Object.keys(errors).map((f) => [f, true]))
		};
		formError = form.message ?? null;

		const firstInvalid = firstInvalidSignUpField(errors);
		if (firstInvalid) queueMicrotask(() => focusField(firstInvalid));
	});

	function clearFieldError(field: SignUpField) {
		if (fieldErrors[field]) {
			const next = { ...fieldErrors };
			delete next[field];
			fieldErrors = next;
		}
	}

	function clearError(field: SignUpField) {
		clearFieldError(field);
		if (formError) formError = null;
	}

	function handleFocus(field: SignUpField) {
		focusedField = field;
	}

	function handleBlur(field: SignUpField) {
		focusedField = null;
		if (field === 'legalCompanyName') legalCompanyName = legalCompanyName.trim();
		if (field === 'userEmail') userEmail = userEmail.trim().toLowerCase();

		touched = { ...touched, [field]: true };
		const error = validateSignUpField(field, values);
		if (error) {
			fieldErrors = { ...fieldErrors, [field]: error };
		} else {
			clearFieldError(field);
		}
	}

	function isFieldEmpty(field: SignUpField): boolean {
		return values[field].trim().length === 0;
	}

	function showError(field: SignUpField): boolean {
		return Boolean(touched[field] && fieldErrors[field] && !isFieldEmpty(field));
	}

	function isInvalid(field: SignUpField): boolean {
		return showError(field) && focusedField !== field;
	}

	function focusField(field: SignUpField) {
		if (field === 'businessType') {
			document.querySelector<HTMLElement>('[aria-labelledby="businessType-label"] button')?.focus();
			return;
		}
		document.getElementById(field)?.focus();
	}

	const onEnhance: SubmitFunction = ({ cancel }) => {
		legalCompanyName = legalCompanyName.trim();
		userEmail = userEmail.trim().toLowerCase();

		const errors = validateSignUp(values);
		if (Object.keys(errors).length > 0) {
			fieldErrors = errors;
			touched = {
				...touched,
				...Object.fromEntries(Object.keys(errors).map((field) => [field, true]))
			};
			formError = null;
			const firstInvalid = firstInvalidSignUpField(errors);
			if (firstInvalid) queueMicrotask(() => focusField(firstInvalid));
			cancel();
			return;
		}

		submitting = true;
		formError = null;
		return async ({ result, update }) => {
			submitting = false;
			if (result.type === 'redirect') {
				toast.success('Account created. Check your email for a code.', { position: 'top-right' });
			}
			await update({ reset: false });
		};
	};
</script>

<AuthFormShell title="Create your account" subtitle="Set up your business account to get started.">
	{#if formError}
		<p class="text-sm text-destructive" role="alert">{formError}</p>
	{/if}

	<form
		method="POST"
		action="?/signup"
		class="flex flex-col gap-3"
		novalidate
		use:enhance={onEnhance}
	>
		<div class="flex flex-col gap-1.5">
			<label class="text-sm font-medium text-foreground" for="userEmail"> Work Email </label>
			<Input
				id="userEmail"
				name="userEmail"
				type="email"
				placeholder="name@company.com"
				bind:value={userEmail}
				autocomplete="email"
				disabled={submitting}
				aria-invalid={isInvalid('userEmail') ? 'true' : undefined}
				aria-describedby={showError('userEmail') ? 'userEmail-error' : undefined}
				class="h-9 text-sm!"
				oninput={() => clearError('userEmail')}
				onfocus={() => handleFocus('userEmail')}
				onblur={() => handleBlur('userEmail')}
			/>
			{#if showError('userEmail')}
				<p id="userEmail-error" class="text-sm text-destructive" role="alert">
					{fieldErrors.userEmail}
				</p>
			{/if}
		</div>

		<div class="flex flex-col gap-1.5">
			<label class="text-sm font-medium text-foreground" for="phoneNumber"> Phone Number </label>
			<PhoneInput
				id="phoneNumber"
				name="phoneNumber"
				placeholder="9876543210"
				bind:value={phoneNumber}
				autocomplete="tel-national"
				disabled={submitting}
				invalid={isInvalid('phoneNumber')}
				aria-invalid={isInvalid('phoneNumber') ? 'true' : undefined}
				aria-describedby={showError('phoneNumber') ? 'phoneNumber-error' : undefined}
				class="h-9!"
				onValueChange={() => clearError('phoneNumber')}
				onfocus={() => handleFocus('phoneNumber')}
				onblur={() => handleBlur('phoneNumber')}
			/>
			{#if showError('phoneNumber')}
				<p id="phoneNumber-error" class="text-sm text-destructive" role="alert">
					{fieldErrors.phoneNumber}
				</p>
			{/if}
		</div>

		<div class="flex flex-col gap-1.5">
			<label class="text-sm font-medium text-foreground" for="password">Password</label>
			<div class="relative">
				<Input
					id="password"
					name="password"
					type={showPassword ? 'text' : 'password'}
					placeholder="Enter Password"
					bind:value={password}
					autocomplete="new-password"
					disabled={submitting}
					aria-invalid={isInvalid('password') ? 'true' : undefined}
					aria-describedby={showError('password')
						? 'password-error'
						: password.length > 0
							? 'password-strength'
							: undefined}
					class="h-9 pr-10 text-sm!"
					oninput={() => clearError('password')}
					onfocus={() => handleFocus('password')}
					onblur={() => handleBlur('password')}
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
			{#if showError('password')}
				<p id="password-error" class="text-sm text-destructive" role="alert">
					{fieldErrors.password}
				</p>
			{:else if password.length > 0}
				<PasswordChecklist id="password-strength" {password} />
			{/if}
		</div>

		<div class="flex flex-col gap-1.5">
			<label class="text-sm font-medium text-foreground" for="legalCompanyName">
				Legal Company Name
			</label>
			<Input
				id="legalCompanyName"
				name="legalCompanyName"
				type="text"
				placeholder="Enter legal company name"
				bind:value={legalCompanyName}
				autocomplete="organization"
				disabled={submitting}
				aria-invalid={isInvalid('legalCompanyName') ? 'true' : undefined}
				aria-describedby={showError('legalCompanyName') ? 'legalCompanyName-error' : undefined}
				class="h-9 text-sm!"
				oninput={() => clearError('legalCompanyName')}
				onfocus={() => handleFocus('legalCompanyName')}
				onblur={() => handleBlur('legalCompanyName')}
			/>
			{#if showError('legalCompanyName')}
				<p id="legalCompanyName-error" class="text-sm text-destructive" role="alert">
					{fieldErrors.legalCompanyName}
				</p>
			{/if}
		</div>

		<div class="flex flex-col gap-1.5">
			<span class="text-sm font-medium text-foreground" id="businessType-label">
				Business Type
			</span>
			<input type="hidden" name="businessType" value={businessType} />
			<CardSelect
				bind:value={businessType}
				options={businessTypeOptions}
				disabled={submitting}
				aria-labelledby="businessType-label"
				onfocusin={() => handleFocus('businessType')}
				onfocusout={() => handleBlur('businessType')}
			/>
			{#if showError('businessType')}
				<p id="businessType-error" class="text-sm text-destructive" role="alert">
					{fieldErrors.businessType}
				</p>
			{/if}
		</div>

		<Button
			type="submit"
			class="h-9 min-h-9 w-full shrink-0 text-sm"
			disabled={submitting || !isFormValid}
		>
			{submitting ? 'Creating account…' : 'Create account'}
		</Button>

		<p class="text-center text-xs text-muted-foreground sm:text-sm">
			Already have an account?
			<a href={resolve('/login')} class="font-medium text-primary hover:underline">Sign in</a>
		</p>
	</form>
</AuthFormShell>
