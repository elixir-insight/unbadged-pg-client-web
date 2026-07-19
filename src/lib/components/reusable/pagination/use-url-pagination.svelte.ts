import { page } from '$app/state';
import { goto } from '$app/navigation';
import { SvelteURL } from 'svelte/reactivity';
import { resolve } from '$app/paths';

export type UrlPaginationOptions = {
	defaultLimit?: number;
	total?: () => number;
};

/**
 * URL-driven pagination composable.
 *
 * Reads skip/limit/search/status from the current URL search params and
 * provides mutation helpers that navigate to the updated URL via goto().
 *
 * Page navigation (next/prev/setPage) pushes history entries so the back
 * button works. Filter/limit changes replace the current history entry to
 * avoid polluting history on every keypress or dropdown pick.
 *
 * Usage in a +page.svelte:
 *
 *   const pagination = createUrlPagination({ total: () => filteredItems.length });
 *
 *   // Pass to DataTable:
 *   <Table
 *     data={pageUsers}
		{columns}
 *     pageNumber={pagination.currentPage}
 *     totalPages={pagination.pageCount}
 *     showingText={pagination.showingText}
 *     setPageNumber={pagination.setPage}
 *   />
 */
export function createUrlPagination({
	defaultLimit = 10,
	total = () => 0
}: UrlPaginationOptions = {}) {
	const skip = $derived(Number(page.url.searchParams.get('skip')) || 0);
	const limit = $derived(Number(page.url.searchParams.get('limit')) || defaultLimit);
	const search = $derived(page.url.searchParams.get('search') ?? '');
	const status = $derived(page.url.searchParams.get('status') ?? '');
	const statuses = $derived(status ? status.split(',').filter(Boolean) : []);
	const type = $derived(page.url.searchParams.get('type') ?? '');
	const currentPage = $derived(Math.ceil(skip / limit) + 1);
	const pageCount = $derived(Math.max(1, Math.ceil(total() / limit)));
	const showingText = $derived.by(() => {
		const t = total();
		if (t === 0) return 'No results';
		const start = skip + 1;
		const end = Math.min(skip + limit, t);
		return `Showing ${start}–${end} of ${t}`;
	});

	function navigate(updates: Record<string, string | null>, replace: boolean) {
		const url = new SvelteURL(page.url.toString());
		for (const [key, value] of Object.entries(updates)) {
			if (value === null || value === '') {
				url.searchParams.delete(key);
			} else {
				url.searchParams.set(key, value);
			}
		}
		const href =
			`${page.url.pathname}?${url.searchParams.toString()}` as `${typeof page.url.pathname}?${string}`;

		goto(resolve(href as '/'), {
			replaceState: replace,
			noScroll: true,
			keepFocus: true
		});
	}

	return {
		get skip() {
			return skip;
		},
		get limit() {
			return limit;
		},
		get search() {
			return search;
		},
		get status() {
			return status;
		},
		/** Same as `status`, split on commas — for multi-select filters. */
		get statuses() {
			return statuses;
		},
		get type() {
			return type;
		},
		get currentPage() {
			return currentPage;
		},
		get pageCount() {
			return pageCount;
		},
		get showingText() {
			return showingText;
		},

		/** Navigate to a specific 1-based page number (pushes history). */
		setPage(pageNum: number) {
			navigate({ skip: String((pageNum - 1) * limit) }, false);
		},
		/** Go to the next page (pushes history). */
		nextPage() {
			if (currentPage < pageCount) {
				navigate({ skip: String(skip + limit) }, false);
			}
		},
		/** Go to the previous page (pushes history). */
		prevPage() {
			if (skip > 0) {
				navigate({ skip: String(Math.max(0, skip - limit)) }, false);
			}
		},
		/** Change page size and reset to page 1 (replaces history). */
		setLimit(newLimit: number) {
			navigate({ limit: String(newLimit), skip: '0' }, true);
		},
		/** Update search term and reset skip (replaces history). */
		setSearch(value: string) {
			navigate({ search: value || null, skip: null }, true);
		},
		/** Update status filter and reset to page 1 (replaces history). */
		setStatus(value: string) {
			navigate({ status: value || null, skip: '0' }, true);
		},
		/** Same as `setStatus`, for multi-select filters — joins values with a comma. */
		setStatuses(values: string[]) {
			navigate({ status: values.length ? values.join(',') : null, skip: '0' }, true);
		},
		/** Update type filter and reset to page 1 (replaces history). */
		setType(value: string) {
			navigate({ type: value || null, skip: null }, true);
		},
		/** Clear all filters (search, status, type) and reset pagination (replaces history). */
		clearAllFilters() {
			navigate({ search: null, status: null, type: null, skip: null }, true);
		}
	};
}
