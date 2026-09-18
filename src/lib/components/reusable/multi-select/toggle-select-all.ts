export function areAllSelected(selected: string[], enabledValues: string[]): boolean {
	return enabledValues.length > 0 && enabledValues.every((value) => selected.includes(value));
}

export function toggleSelectAllValues(selected: string[], enabledValues: string[]): string[] {
	if (areAllSelected(selected, enabledValues)) {
		const enabled = new Set(enabledValues);
		return selected.filter((value) => !enabled.has(value));
	}

	const next = new Set(selected);
	for (const value of enabledValues) {
		next.add(value);
	}
	return [...next];
}
