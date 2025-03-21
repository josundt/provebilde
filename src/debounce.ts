type Func<TArgs extends any[], TReturn> = (...args: TArgs) => TReturn;

export function debounce<TArgs extends any[]>(
    func: Func<TArgs, any>,
    wait: number,
    immediate: boolean = false
): Func<TArgs, void> {
    let timeout: number | null = null;
    return (...args: TArgs) => {
        const later = (): void => {
            timeout = null;
            if (!immediate) {
                func(...args);
            }
        };
        const callNow = immediate && !timeout;
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait) as unknown as number;
        if (callNow) {
            func(...args);
        }
    };
}
