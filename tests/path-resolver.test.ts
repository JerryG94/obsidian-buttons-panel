import { describe, expect, it } from 'vitest';
import { resolve, followRename } from '../src/path-resolver';

class FakeTFile { constructor(public path: string, public extension: string) {} }
class FakeTFolder { constructor(public path: string) {} }

function fakeApp(map: Record<string, FakeTFile | FakeTFolder>) {
	return {
		vault: {
			getAbstractFileByPath: (p: string) => map[p] ?? null,
		},
	};
}

describe('resolve', () => {
	it('returns PATH_EMPTY for empty/whitespace input', () => {
		const app = fakeApp({}) as any;
		expect(resolve(app, '').kind).toBe('PATH_EMPTY');
		expect(resolve(app, '   ').kind).toBe('PATH_EMPTY');
	});

	it('returns NOT_FOUND when missing', () => {
		const app = fakeApp({}) as any;
		const r = resolve(app, 'missing.md');
		expect(r.kind).toBe('NOT_FOUND');
		if (r.kind === 'NOT_FOUND') expect(r.detail).toBe('missing.md');
	});

	it('returns IS_FOLDER for folders', () => {
		const app = fakeApp({ 'foo': new FakeTFolder('foo') }) as any;
		expect(resolve(app, 'foo').kind).toBe('IS_FOLDER');
	});

	it('returns WRONG_TYPE for non-md files', () => {
		const app = fakeApp({ 'a.canvas': new FakeTFile('a.canvas', 'canvas') }) as any;
		expect(resolve(app, 'a.canvas').kind).toBe('WRONG_TYPE');
	});

	it('returns OK for an .md file', () => {
		const f = new FakeTFile('a.md', 'md');
		const app = fakeApp({ 'a.md': f }) as any;
		const r = resolve(app, 'a.md');
		expect(r.kind).toBe('OK');
		if (r.kind === 'OK') expect(r.file).toBe(f);
	});

	it('trims whitespace before lookup', () => {
		const f = new FakeTFile('a.md', 'md');
		const app = fakeApp({ 'a.md': f }) as any;
		expect(resolve(app, '  a.md  ').kind).toBe('OK');
	});
});

describe('followRename', () => {
	const settings = () => ({ sourceNotePath: 'old.md' }) as any;

	it('updates settings when oldPath matches', () => {
		const s = settings();
		const updated = followRename(s, 'new.md', 'old.md');
		expect(updated).toBe(true);
		expect(s.sourceNotePath).toBe('new.md');
	});

	it('does nothing when oldPath does not match', () => {
		const s = settings();
		const updated = followRename(s, 'new.md', 'other.md');
		expect(updated).toBe(false);
		expect(s.sourceNotePath).toBe('old.md');
	});
});
