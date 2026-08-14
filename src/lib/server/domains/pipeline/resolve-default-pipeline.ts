export function resolveDefaultPipelineCode(
	pipelineOptions: { value: string }[],
	vanPipelineCode?: string | null
): string {
	const van = vanPipelineCode?.trim();
	if (van && pipelineOptions.some((option) => option.value === van)) {
		return van;
	}
	return pipelineOptions[0]?.value ?? '';
}
