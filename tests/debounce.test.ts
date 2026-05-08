import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from '../src/debounce';

describe('debounce', () => {
	beforeEach(() => { vi.useFakeTimers(); });
	afterEach(() => { vi.useRealTimers(); });

	it('calls fn once after the delay for a single trigger', () => {
		const fn = vi.fn();
		const d = debounce(fn, 100);
		d();
		expect(fn).not.toHaveBeenCalled();
		vi.advanceTimersByTime(99);
		expect(fn).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('coalesces rapid calls to a single trailing invocation', () => {
		const fn = vi.fn();
		const d = debounce(fn, 100);
		d(); d(); d();
		vi.advanceTimersByTime(99);
		d();
		vi.advanceTimersByTime(100);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('passes the latest arguments to fn', () => {
		const fn = vi.fn();
		const d = debounce(fn, 50);
		d(1); d(2); d(3);
		vi.advanceTimersByTime(50);
		expect(fn).toHaveBeenCalledWith(3);
	});
});
