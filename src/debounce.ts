export function debounce<F extends (...args: unknown[]) => unknown>(fn: F, ms: number): F {
	let timer: ReturnType<typeof setTimeout> | null = null;
	const wrapped = ((...args: Parameters<F>) => {
		if (timer !== null) clearTimeout(timer);
		timer = setTimeout(() => {
			timer = null;
			fn(...args);
		}, ms);
	}) as F;
	return wrapped;
}
