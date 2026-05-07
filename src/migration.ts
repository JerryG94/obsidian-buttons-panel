const CURRENT_VERSION = 1;

type MigrationFn = (raw: Record<string, unknown>) => Record<string, unknown>;

const migrations: Record<number, MigrationFn> = {
	// v0.1.0 没有迁移函数；表本身就是扩展点。
};

export function runMigrations(raw: unknown): Record<string, unknown> {
	const data: Record<string, unknown> = raw && typeof raw === 'object'
		? { ...(raw as Record<string, unknown>) }
		: {};
	const fromVersion = typeof data.version === 'number' ? data.version : 0;
	for (let v = fromVersion + 1; v <= CURRENT_VERSION; v++) {
		const fn = migrations[v];
		if (fn) Object.assign(data, fn(data));
	}
	data.version = Math.max(CURRENT_VERSION, fromVersion);
	return data;
}
