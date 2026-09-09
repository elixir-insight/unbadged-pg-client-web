<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { PageProps } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input, Dropdown, PhoneInput, toast } from '$lib/components/reusable';
	import { CompanyLogoLight } from '$lib/assets/icons';
	import { Eye, EyeOff } from '$lib/assets/icons/index';
	import {
		SIGN_UP_BUSINESS_TYPES,
		SIGN_UP_PASSWORD_ERROR,
		firstInvalidSignUpField,
		getPasswordStrength,
		isSignUpFormValid,
		validateSignUp,
		validateSignUpField,
		type SignUpField,
		type SignUpInput
	} from '$lib/validation/sign-up';

	let { form }: PageProps = $props();

	let legalCompanyName = $state('');
	let businessType = $state('');
	let userEmail = $state('');
	let phoneNumber = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let submitting = $state(false);
	let formError = $state<string | null>(null);
	let fieldErrors = $state<Partial<Record<SignUpField, string>>>({});

	const values: SignUpInput = $derived({
		legalCompanyName,
		businessType,
		userEmail,
		phoneNumber,
		password,
		affiliateId: ''
	});
	const isFormValid = $derived(isSignUpFormValid(values));
	const passwordStrength = $derived(getPasswordStrength(password));

	$effect(() => {
		if (!form) return;
		if (form.legalCompanyName !== undefined) legalCompanyName = form.legalCompanyName;
		if (form.businessType !== undefined) businessType = form.businessType;
		if (form.userEmail !== undefined) userEmail = form.userEmail.trim().toLowerCase();
		if (form.phoneNumber !== undefined) phoneNumber = form.phoneNumber;
		fieldErrors = form.errors ?? {};
		formError = form.message ?? null;
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

	function handleBlur(field: SignUpField) {
		if (field === 'legalCompanyName') legalCompanyName = legalCompanyName.trim();
		if (field === 'userEmail') userEmail = userEmail.trim().toLowerCase();

		const error = validateSignUpField(field, {
			legalCompanyName,
			businessType,
			userEmail,
			phoneNumber,
			password,
			affiliateId: ''
		});
		if (error) {
			fieldErrors = { ...fieldErrors, [field]: error };
		} else {
			clearFieldError(field);
		}
	}

	function focusField(field: SignUpField) {
		if (field === 'businessType') {
			document.querySelector<HTMLElement>('#businessType button')?.focus();
			return;
		}
		document.getElementById(field)?.focus();
	}

	const onEnhance: SubmitFunction = ({ cancel }) => {
		const errors = validateSignUp({
			legalCompanyName: legalCompanyName.trim(),
			businessType,
			userEmail: userEmail.trim().toLowerCase(),
			phoneNumber,
			password,
			affiliateId: ''
		});
		if (Object.keys(errors).length > 0) {
			fieldErrors = errors;
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

<main class="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 sm:px-8 lg:px-10">
	<div class="min-h-0 flex-1" aria-hidden="true"></div>
	<div class="mx-auto w-full max-w-xl shrink-0 py-2 sm:py-4">
		<div class="flex w-full flex-col gap-6 sm:gap-8 [@media(max-height:700px)]:gap-4">
			<div>
				<CompanyLogoLight width="160" class="h-auto w-36 sm:w-40" />
			</div>

			<div class="flex flex-col gap-5 sm:gap-6 [@media(max-height:700px)]:gap-4">
				<div class="flex flex-col gap-1.5 sm:gap-2">
					<h1 class="text-2xl font-semibold tracking-tight text-gray-700 sm:text-3xl">
						Create your account
					</h1>
					<p class="text-sm text-muted-foreground sm:text-base">
						Set up your business account to get started.
					</p>
				</div>

				{#if formError}
					<p class="text-sm text-destructive" role="alert">{formError}</p>
				{/if}

				<form
					method="POST"
					action="?/signup"
					class="flex flex-col gap-4 sm:gap-5"
					novalidate
					use:enhance={onEnhance}
				>
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-5">
						<div class="flex flex-col gap-2">
							<label class="text-base font-normal text-gray-700 sm:text-lg" for="legalCompanyName">
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
								aria-invalid={fieldErrors.legalCompanyName ? 'true' : undefined}
								aria-describedby={fieldErrors.legalCompanyName
									? 'legalCompanyName-error'
									: undefined}
								class="h-11 text-base!"
								oninput={() => clearError('legalCompanyName')}
								onblur={() => handleBlur('legalCompanyName')}
							/>
							{#if fieldErrors.legalCompanyName}
								<p id="legalCompanyName-error" class="text-sm text-destructive" role="alert">
									{fieldErrors.legalCompanyName}
								</p>
							{/if}
						</div>

						<div class="flex flex-col gap-2">
							<label class="text-base font-normal text-gray-700 sm:text-lg" for="businessType">
								Business Type
							</label>
							<div id="businessType" onfocusout={() => handleBlur('businessType')}>
								<input type="hidden" name="businessType" value={businessType} />
								<Dropdown
									bind:value={businessType}
									options={[...SIGN_UP_BUSINESS_TYPES]}
									placeholder="Select business type"
									disabled={submitting}
									ariaLabel="Business Type"
									class="h-11! w-full text-base! {fieldErrors.businessType
										? 'border-destructive'
										: ''}"
									onValueChange={() => clearError('businessType')}
								/>
							</div>
							{#if fieldErrors.businessType}
								<p id="businessType-error" class="text-sm text-destructive" role="alert">
									{fieldErrors.businessType}
								</p>
							{/if}
						</div>

						<div class="flex flex-col gap-2">
							<label class="text-base font-normal text-gray-700 sm:text-lg" for="userEmail">
								Email
							</label>
							<Input
								id="userEmail"
								name="userEmail"
								type="email"
								placeholder="name@company.com"
								bind:value={userEmail}
								autocomplete="email"
								disabled={submitting}
								aria-invalid={fieldErrors.userEmail ? 'true' : undefined}
								aria-describedby={fieldErrors.userEmail ? 'userEmail-error' : undefined}
								class="h-11 text-base!"
								oninput={() => clearError('userEmail')}
								onblur={() => handleBlur('userEmail')}
							/>
							{#if fieldErrors.userEmail}
								<p id="userEmail-error" class="text-sm text-destructive" role="alert">
									{fieldErrors.userEmail}
								</p>
							{/if}
						</div>

						<div class="flex flex-col gap-2">
							<label class="text-base font-normal text-gray-700 sm:text-lg" for="phoneNumber">
								Phone Number
							</label>
							<PhoneInput
								id="phoneNumber"
								name="phoneNumber"
								placeholder="9876543210"
								bind:value={phoneNumber}
								autocomplete="tel-national"
								disabled={submitting}
								invalid={Boolean(fieldErrors.phoneNumber)}
								aria-invalid={fieldErrors.phoneNumber ? 'true' : undefined}
								aria-describedby={fieldErrors.phoneNumber ? 'phoneNumber-error' : undefined}
								class="h-11!"
								onValueChange={() => clearError('phoneNumber')}
								onblur={() => handleBlur('phoneNumber')}
							/>
							{#if fieldErrors.phoneNumber}
								<p id="phoneNumber-error" class="text-sm text-destructive" role="alert">
									{fieldErrors.phoneNumber}
								</p>
							{/if}
						</div>

						<div class="flex flex-col gap-2 sm:col-span-2">
							<label class="text-base font-normal text-gray-700 sm:text-lg" for="password">
								Password
							</label>
							<div class="relative">
								<Input
									id="password"
									name="password"
									type={showPassword ? 'text' : 'password'}
									placeholder="Enter Password"
									bind:value={password}
									autocomplete="new-password"
									disabled={submitting}
									aria-invalid={fieldErrors.password ? 'true' : undefined}
									aria-describedby={fieldErrors.password
										? 'password-error'
										: passwordStrength === 'strong'
											? 'password-hint password-strength'
											: 'password-hint'}
									class="h-11 pr-11 text-base!"
									oninput={() => clearError('password')}
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
							{#if fieldErrors.password}
								<p id="password-error" class="text-sm text-destructive" role="alert">
									{fieldErrors.password}
								</p>
							{:else}
								<p id="password-hint" class="text-sm text-muted-foreground">
									{SIGN_UP_PASSWORD_ERROR}
								</p>
								{#if passwordStrength === 'strong'}
									<p id="password-strength" class="text-sm text-primary">Strong</p>
								{/if}
							{/if}
						</div>
					</div>

					<Button
						type="submit"
						class="h-11 min-h-11 w-full shrink-0 text-base"
						disabled={submitting || !isFormValid}
					>
						{submitting ? 'Signing up…' : 'Sign up'}
					</Button>

					<p class="text-center text-xs text-muted-foreground sm:text-sm">
						Already have an account?
						<a href={resolve('/login')} class="underline underline-offset-4 hover:text-foreground">
							Sign in
						</a>
					</p>
				</form>
			</div>
		</div>
	</div>
	<div class="min-h-0 flex-1" aria-hidden="true"></div>
</main>

<footer
	class="flex shrink-0 flex-col gap-4 bg-background px-5 py-4 text-center sm:gap-6 sm:px-8 lg:px-10"
>
	<p class="text-xs text-muted-foreground sm:text-sm">
		<a
			href="https://elixirpay.in/terms"
			target="_blank"
			class="underline underline-offset-4 hover:text-foreground"
		>
			Terms and Conditions
		</a>
		<span class="mx-3 text-border" aria-hidden="true">|</span>
		<a
			href="https://elixirpay.in/privacy"
			target="_blank"
			class="underline underline-offset-4 hover:text-foreground"
		>
			Privacy Policy
		</a>
	</p>
	<p class="text-xs text-muted-foreground sm:text-sm">
		© 2026 ElixirPay • Secure Payment Gateway Platform
	</p>
</footer>
