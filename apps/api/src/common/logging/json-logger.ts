import type { LoggerService } from '@nestjs/common';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LEVEL_WEIGHT: Readonly<Record<Exclude<LogLevel, 'silent'>, number>> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const REDACTED = '[redacted]';
const SENSITIVE_KEY = /(pass(word)?|secret|token|authorization|cookie|api[-_]?key|credential)/i;
const MAX_DEPTH = 4;
const MAX_STRING = 2_000;

function redact(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) {
    return '[truncated]';
  }

  if (typeof value === 'string') {
    return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => redact(item, depth + 1));
  }

  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }

  if (typeof value === 'object' && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      result[key] = SENSITIVE_KEY.test(key) ? REDACTED : redact(entry, depth + 1);
    }
    return result;
  }

  return value;
}

/**
 * Minimal structured logger.
 *
 * Deliberately dependency-free: one JSON object per line, level-filtered, with
 * recursive redaction of anything that looks like a credential. It is not a
 * tracing platform; correlation is carried by `requestId` fields that callers pass
 * explicitly.
 *
 * Callers must never pass raw request objects, headers, cookies, or bodies. The
 * redaction is a second line of defence, not a licence to log them.
 */
export class JsonLogger implements LoggerService {
  private readonly threshold: number;

  constructor(
    level: LogLevel,
    private readonly write: (line: string) => void = (line) => process.stdout.write(`${line}\n`),
  ) {
    this.threshold = level === 'silent' ? Number.POSITIVE_INFINITY : LEVEL_WEIGHT[level];
  }

  log(message: unknown, context?: string): void {
    this.emit('info', message, context);
  }

  debug(message: unknown, context?: string): void {
    this.emit('debug', message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.emit('debug', message, context);
  }

  warn(message: unknown, context?: string): void {
    this.emit('warn', message, context);
  }

  error(message: unknown, stack?: string, context?: string): void {
    this.emit('error', message, context, stack);
  }

  fatal(message: unknown, context?: string): void {
    this.emit('error', message, context);
  }

  private emit(
    level: Exclude<LogLevel, 'silent'>,
    message: unknown,
    context?: string,
    stack?: string,
  ): void {
    if (LEVEL_WEIGHT[level] < this.threshold) {
      return;
    }

    let payload: unknown = message;
    if (typeof message === 'object' && message !== null && !(message instanceof Error)) {
      payload = redact(message);
    } else if (message instanceof Error) {
      payload = redact({ error: message });
    }

    const record = {
      level,
      time: new Date().toISOString(),
      ...(context ? { context } : {}),
      message: typeof payload === 'string' ? payload : redact(payload),
      ...(stack ? { stack: stack.split('\n').slice(0, 12).join('\n') } : {}),
    };

    this.write(JSON.stringify(record));
  }
}
