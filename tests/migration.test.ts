import { describe, expect, it } from 'vitest';
import { runMigrations } from '../src/migration';

describe('runMigrations', () => {
	it('handles an empty object', () => {
		const out = runMigrations({});
		expect(out.version).toBe(1);
	});

	it('preserves user values', () => {
		const out = runMigrations({ sourceNotePath: 'foo.md' });
		expect(out.sourceNotePath).toBe('foo.md');
		expect(out.version).toBe(1);
	});

	it('does not throw for a future unknown version', () => {
		expect(() => runMigrations({ version: 99, x: 1 })).not.toThrow();
	});

	it('forces version up to CURRENT_VERSION even if missing', () => {
		const out = runMigrations({ sourceNotePath: 'a.md' });
		expect(out.version).toBe(1);
	});
});
