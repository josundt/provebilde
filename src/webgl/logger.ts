type LogFn = (message: string, ...args: any[]) => void;

export interface ILogger {
    debug: LogFn;
    info: LogFn;
    warn: LogFn;
    error: LogFn;
}
