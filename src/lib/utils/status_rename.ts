const ACRONYMS = new Set(['LLP']);
export function formatStatusLabel(status: string): string {
	return status
		.split('_')
		.map((word) =>
			ACRONYMS.has(word) ? word : word[0].toUpperCase() + word.slice(1).toLowerCase()
		)
		.join(' ');
}
