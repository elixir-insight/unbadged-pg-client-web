<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Breadcrumb from './breadcrumb.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/Breadcrumb',
		component: Breadcrumb,
		tags: ['autodocs']
	});
</script>

<!-- Single item: current page only -->
<Story name="Single Item" asChild>
	<Breadcrumb class="block" items={[{ label: 'Management', href: '/' }]} />
</Story>

<!-- Two items: parent / current -->
<Story name="Two Items" asChild>
	<Breadcrumb
		class="block"
		items={[
			{ label: 'Dashboard', href: '/' },
			{ label: 'Transactions', href: '/transactions' }
		]}
	/>
</Story>

<!-- Three items: first / parent / current -->
<Story name="Three Items" asChild>
	<Breadcrumb
		class="block"
		items={[
			{ label: 'Dashboard', href: '/' },
			{ label: 'Management', href: '/management' },
			{ label: 'Onboarding', href: '/management/onboarding' }
		]}
	/>
</Story>

<!-- Four+ items: ellipsis on mobile, full path on desktop -->
<Story name="Four Items (Deep Path)" asChild>
	<Breadcrumb
		class="block"
		items={[
			{ label: 'Dashboard', href: '/' },
			{ label: 'Management', href: '/management' },
			{ label: 'Clients', href: '/management/clients' },
			{ label: 'Client Detail', href: '/management/clients/detail' }
		]}
	/>
</Story>
