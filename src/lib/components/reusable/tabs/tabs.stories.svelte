<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Tabs from './tabs.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/Tabs',
		component: Tabs,
		tags: ['autodocs'],
		argTypes: {
			variant: {
				control: 'select',
				options: ['default', 'line'],
				description: 'Visual style of the tab list'
			},
			orientation: {
				control: 'select',
				options: ['horizontal', 'vertical'],
				description: 'Direction of the tab list'
			}
		},
		args: {
			variant: 'default',
			orientation: 'horizontal'
		}
	});
</script>

<script>
	import UserIcon from '@lucide/svelte/icons/user';
	import BellIcon from '@lucide/svelte/icons/bell';
	import ShieldIcon from '@lucide/svelte/icons/shield';
	import CreditCardIcon from '@lucide/svelte/icons/credit-card';
	import BarChart2Icon from '@lucide/svelte/icons/bar-chart-2';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
</script>

<!-- Default -->
<Story name="Default" args={{ variant: 'default', orientation: 'horizontal' }}>
	{#snippet template(args)}
		<div class="w-[480px]">
			<Tabs
				{...args}
				tabs={[
					{
						value: 'account',
						label: 'Account',
						content: accountContent
					},
					{
						value: 'notifications',
						label: 'Notifications',
						content: notificationsContent
					},
					{
						value: 'security',
						label: 'Security',
						content: securityContent
					}
				]}
			/>
		</div>
	{/snippet}
</Story>

{#snippet accountContent()}
	<div class="rounded-lg border p-4 text-sm text-muted-foreground">
		Manage your account details, profile picture, and display name.
	</div>
{/snippet}

{#snippet notificationsContent()}
	<div class="rounded-lg border p-4 text-sm text-muted-foreground">
		Configure email and push notification preferences.
	</div>
{/snippet}

{#snippet securityContent()}
	<div class="rounded-lg border p-4 text-sm text-muted-foreground">
		Update your password, enable 2FA, and review active sessions.
	</div>
{/snippet}

<!-- Line Variant -->
<Story name="Line Variant" args={{ variant: 'line', orientation: 'horizontal' }}>
	{#snippet template(args)}
		<div class="w-[480px]">
			<Tabs
				{...args}
				tabs={[
					{ value: 'overview', label: 'Overview', content: overviewContent },
					{ value: 'reports', label: 'Reports', content: reportsContent },
					{ value: 'billing', label: 'Billing', content: billingContent }
				]}
			/>
		</div>
	{/snippet}
</Story>

{#snippet overviewContent()}
	<div class="rounded-lg border p-4 text-sm text-muted-foreground">
		High-level summary of account activity and usage metrics.
	</div>
{/snippet}

{#snippet reportsContent()}
	<div class="rounded-lg border p-4 text-sm text-muted-foreground">
		Download or schedule detailed usage and transaction reports.
	</div>
{/snippet}

{#snippet billingContent()}
	<div class="rounded-lg border p-4 text-sm text-muted-foreground">
		View invoices, update payment methods, and manage billing cycles.
	</div>
{/snippet}

<!-- With Icons -->
<Story name="With Icons">
	{#snippet template()}
		<div class="w-[520px]">
			<Tabs
				tabs={[
					{ value: 'profile', label: 'Profile', icon: UserIcon, content: profileContent },
					{
						value: 'notifications',
						label: 'Notifications',
						icon: BellIcon,
						content: notifIconContent
					},
					{ value: 'security', label: 'Security', icon: ShieldIcon, content: secIconContent },
					{ value: 'billing', label: 'Billing', icon: CreditCardIcon, content: billIconContent }
				]}
			/>
		</div>
	{/snippet}
</Story>

{#snippet profileContent()}
	<div class="rounded-lg border p-4 text-sm text-muted-foreground">
		Edit your display name, bio, and profile photo.
	</div>
{/snippet}

{#snippet notifIconContent()}
	<div class="rounded-lg border p-4 text-sm text-muted-foreground">
		Manage alerts for payments, logins, and system events.
	</div>
{/snippet}

{#snippet secIconContent()}
	<div class="rounded-lg border p-4 text-sm text-muted-foreground">
		Review connected devices and set up two-factor authentication.
	</div>
{/snippet}

{#snippet billIconContent()}
	<div class="rounded-lg border p-4 text-sm text-muted-foreground">
		View invoices and update your payment method.
	</div>
{/snippet}

<!-- With Icons + Line Variant -->
<Story name="Icons + Line Variant">
	{#snippet template()}
		<div class="w-[520px]">
			<Tabs
				variant="line"
				tabs={[
					{
						value: 'analytics',
						label: 'Analytics',
						icon: BarChart2Icon,
						content: analyticsContent
					},
					{ value: 'reports', label: 'Reports', icon: FileTextIcon, content: reportsIconContent },
					{ value: 'billing', label: 'Billing', icon: CreditCardIcon, content: billLine }
				]}
			/>
		</div>
	{/snippet}
</Story>

{#snippet analyticsContent()}
	<div class="rounded-lg border p-4 text-sm text-muted-foreground">
		Transaction volume, success rates, and revenue trends.
	</div>
{/snippet}

{#snippet reportsIconContent()}
	<div class="rounded-lg border p-4 text-sm text-muted-foreground">
		Scheduled and on-demand report exports.
	</div>
{/snippet}

{#snippet billLine()}
	<div class="rounded-lg border p-4 text-sm text-muted-foreground">
		Subscription plans and invoice history.
	</div>
{/snippet}

<!-- Vertical -->
<Story name="Vertical">
	{#snippet template()}
		<div class="w-[560px]">
			<Tabs
				orientation="vertical"
				tabs={[
					{ value: 'account', label: 'Account', icon: UserIcon, content: vertAccContent },
					{ value: 'security', label: 'Security', icon: ShieldIcon, content: vertSecContent },
					{ value: 'billing', label: 'Billing', icon: CreditCardIcon, content: vertBillContent }
				]}
			/>
		</div>
	{/snippet}
</Story>

{#snippet vertAccContent()}
	<div class="rounded-lg border p-4 text-sm text-muted-foreground">
		Account details, preferences, and profile settings.
	</div>
{/snippet}

{#snippet vertSecContent()}
	<div class="rounded-lg border p-4 text-sm text-muted-foreground">
		Password management and two-factor authentication.
	</div>
{/snippet}

{#snippet vertBillContent()}
	<div class="rounded-lg border p-4 text-sm text-muted-foreground">
		Payment methods, invoices, and subscription plans.
	</div>
{/snippet}

<!-- With Disabled Tab -->
<Story name="With Disabled Tab">
	{#snippet template()}
		<div class="w-[480px]">
			<Tabs
				tabs={[
					{ value: 'overview', label: 'Overview', content: disabledOverview },
					{
						value: 'advanced',
						label: 'Advanced',
						content: disabledAdvanced,
						disabled: true
					},
					{ value: 'billing', label: 'Billing', content: disabledBilling }
				]}
			/>
		</div>
	{/snippet}
</Story>

{#snippet disabledOverview()}
	<div class="rounded-lg border p-4 text-sm text-muted-foreground">
		Overview content is shown here.
	</div>
{/snippet}

{#snippet disabledAdvanced()}
	<div class="rounded-lg border p-4 text-sm text-muted-foreground">Advanced settings.</div>
{/snippet}

{#snippet disabledBilling()}
	<div class="rounded-lg border p-4 text-sm text-muted-foreground">
		Billing and payment details.
	</div>
{/snippet}
