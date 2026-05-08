import en from './en';
import zh from './zh';

type Dict = Record<string, unknown>;
const dicts: Record<string, Dict> = { en, zh };

let currentLocale: 'en' | 'zh' = 'en';

export function initI18n(): void {
	const lang = (typeof window !== 'undefined' && window.localStorage)
		? (window.localStorage.getItem('language') ?? 'en')
		: 'en';
	currentLocale = lang.startsWith('zh') ? 'zh' : 'en';
}

export function getLocale(): 'en' | 'zh' {
	return currentLocale;
}

export function t(key: string, params?: Record<string, string>): string {
	const fromCurrent = lookupNested(dicts[currentLocale], key);
	const fromEn = lookupNested(dicts.en, key);
	const value = (typeof fromCurrent === 'string' ? fromCurrent : undefined)
		?? (typeof fromEn === 'string' ? fromEn : undefined)
		?? key;
	return interpolate(value, params);
}

function lookupNested(obj: Dict | undefined, key: string): unknown {
	if (!obj) return undefined;
	return key.split('.').reduce<unknown>((acc, k) => {
		if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[k];
		return undefined;
	}, obj);
}

function interpolate(s: string, params?: Record<string, string>): string {
	if (!params) return s;
	return s.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`);
}
