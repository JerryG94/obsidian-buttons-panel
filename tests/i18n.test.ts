import { describe, expect, it, beforeEach } from 'vitest';
import en from '../src/i18n/en';
import zh from '../src/i18n/zh';
import * as i18n from '../src/i18n';

function flatten(obj: Record<string, unknown>, prefix = ''): string[] {
	const out: string[] = [];
	for (const [k, v] of Object.entries(obj)) {
		const key = prefix ? `${prefix}.${k}` : k;
		if (v && typeof v === 'object') out.push(...flatten(v as Record<string, unknown>, key));
		else out.push(key);
	}
	return out;
}

describe('i18n dictionaries', () => {
	it('en and zh have identical key sets', () => {
		const enKeys = flatten(en).sort();
		const zhKeys = flatten(zh).sort();
		expect(zhKeys).toEqual(enKeys);
	});
});

describe('i18n.t()', () => {
	beforeEach(() => {
		(globalThis as any).window = { localStorage: { getItem: () => 'en' } };
		i18n.initI18n();
	});

	it('returns the english value for a known key', () => {
		expect(i18n.t('view.title')).toBe('Buttons Panel');
	});

	it('uses zh when locale starts with zh', () => {
		(globalThis as any).window.localStorage.getItem = () => 'zh-CN';
		i18n.initI18n();
		expect(i18n.t('view.title')).toBe('按钮面板');
	});

	it('interpolates {placeholders}', () => {
		expect(i18n.t('error.NOT_FOUND', { detail: 'foo.md' })).toBe('Note not found: foo.md');
	});

	it('returns the key itself when not found', () => {
		expect(i18n.t('does.not.exist')).toBe('does.not.exist');
	});

	it('getLocale returns the resolved locale', () => {
		(globalThis as any).window.localStorage.getItem = () => 'zh-TW';
		i18n.initI18n();
		expect(i18n.getLocale()).toBe('zh');
	});
});
