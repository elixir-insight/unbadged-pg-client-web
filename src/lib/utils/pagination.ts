import { page } from '$app/state';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';

export function createPagination(defaultLimit = 10) {
	const getParams = () => {
		const url = new URL(page.url);
		return {
			skip: Number(url.searchParams.get('skip') ?? 0),
			limit: Number(url.searchParams.get('limit') ?? defaultLimit),
			search: url.searchParams.get('search') ?? '',
			filter: url.searchParams.get('filter') ?? '',
			value: url.searchParams.get('value') ?? '',
			status: url.searchParams.get('status') ?? '',
			dateRange: url.searchParams.get('dateRange') ?? '',
			customFrom: url.searchParams.get('customFrom') ?? '',
			customTo: url.searchParams.get('customTo') ?? ''
		};
	};

	const updateParams = (updates: Record<string, string | number | null>, push = false) => {
		const url = new URL(page.url);
		Object.entries(updates).forEach(([key, value]) => {
			if (value === '' || value === null || value === undefined) {
				url.searchParams.delete(key);
			} else {
				url.searchParams.set(key, String(value));
			}
		});
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(resolve(url.pathname as '/') + url.search, {
			replaceState: !push,
			keepFocus: true,
			noScroll: true
		});
	};

	return {
		getParams,
		updateParams,

		setPage: (pageNumber: number) => updateParams({ skip: (pageNumber - 1) * getParams().limit }),

		next: () => {
			const { skip, limit } = getParams();
			updateParams({ skip: skip + limit });
		},

		prev: () => {
			const { skip, limit } = getParams();
			updateParams({ skip: Math.max(0, skip - limit) });
		},

		setSearch: (search: string) => updateParams({ search, skip: 0 }),

		setFilter: (filter: string, value: string) => updateParams({ filter, value, skip: 0 }),

		setStatus: (status: string) => updateParams({ status, skip: 0 }),

		setDateRange: (dateRange: string, customFrom?: string, customTo?: string) =>
			updateParams({
				dateRange,
				customFrom: customFrom ?? null,
				customTo: customTo ?? null,
				skip: 0
			}),

		reset: () => {
			const url = new URL(page.url);
			[
				'skip',
				'limit',
				'search',
				'filter',
				'value',
				'status',
				'dateRange',
				'customFrom',
				'customTo'
			].forEach((k) => url.searchParams.delete(k));
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			goto(resolve(url.pathname as '/') + url.search, {
				replaceState: false,
				keepFocus: true,
				noScroll: true
			});
		}
	};
}
