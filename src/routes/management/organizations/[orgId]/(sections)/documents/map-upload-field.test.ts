import { describe, expect, it } from 'vitest';
import { directorFormDataFieldName, formDataFieldName } from './map-upload-field';

describe('formDataFieldName', () => {
	it('maps a known document type to its backend field name', () => {
		expect(formDataFieldName('PAN Card')).toBe('PAN_CARD');
		expect(formDataFieldName('Brand logo')).toBe('BRAND_LOGO');
	});

	it('strips parentheses before falling back to a normalized name', () => {
		expect(formDataFieldName('Article of Association (AOA)')).toBe('ARTICLE_OF_ASSOCIATION_AOA');
	});

	it('falls back to a normalized uppercase name for unknown document types', () => {
		expect(formDataFieldName('Some Custom Document')).toBe('SOME_CUSTOM_DOCUMENT');
	});

	it('prefixes the field name with the director id when provided', () => {
		expect(formDataFieldName('Aadhar Card', 'dir-1')).toBe('DIRECTOR_DIR-1_AADHAR_CARD');
	});
});

describe('directorFormDataFieldName', () => {
	it('maps director document slots to upstream field names', () => {
		expect(directorFormDataFieldName('aadharDocument')).toBe('aadhar');
		expect(directorFormDataFieldName('panDocument')).toBe('pan');
	});
});
