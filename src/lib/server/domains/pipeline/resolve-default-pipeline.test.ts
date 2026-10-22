import { describe, expect, it } from 'vitest';
import { resolveDefaultPipelineCode } from './resolve-default-pipeline';

describe('resolveDefaultPipelineCode', () => {
	it('prefers the VAN pipeline when available', () => {
		expect(resolveDefaultPipelineCode([{ value: 'OTHER' }, { value: 'TEST' }], 'TEST')).toBe(
			'TEST'
		);
	});

	it('falls back to the first pipeline option', () => {
		expect(resolveDefaultPipelineCode([{ value: 'TEST' }], 'MISSING')).toBe('TEST');
	});
});
