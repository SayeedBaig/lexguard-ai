/**
 * LexGuard — Agent Logger
 *
 * Lightweight, structured console logger for agent pipeline observability.
 * Uses prefixed, timestamped output so logs are easy to grep in production.
 * No external dependencies — intentionally thin.
 */

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface AgentLogEntry {
  level: LogLevel;
  agentName: string;
  runId: string;
  message: string;
  meta?: Record<string, unknown>;
  timestamp: string;
}

function formatLog(entry: AgentLogEntry): string {
  const meta = entry.meta ? ` | ${JSON.stringify(entry.meta)}` : "";
  return `[LexGuard:${entry.agentName}] [${entry.level.toUpperCase()}] [run:${entry.runId}] ${entry.message}${meta}`;
}

export class AgentLogger {
  constructor(
    public readonly agentName: string,
    public readonly runId: string,
  ) {}

  private emit(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const entry: AgentLogEntry = {
      level,
      agentName: this.agentName,
      runId: this.runId,
      message,
      meta,
      timestamp: new Date().toISOString(),
    };
    const formatted = formatLog(entry);
    if (level === "error") {
      console.error(formatted);
    } else if (level === "warn") {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.emit("info", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.emit("warn", message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.emit("error", message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== "production") {
      this.emit("debug", message, meta);
    }
  }

  /** Log agent start with input shape */
  start(inputSummary: Record<string, unknown>): void {
    this.info("Agent started", inputSummary);
  }

  /** Log agent completion with timing */
  complete(durationMs: number, outputSummary?: Record<string, unknown>): void {
    this.info("Agent completed", { durationMs, ...outputSummary });
  }

  /** Log agent failure with timing */
  fail(durationMs: number, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.error("Agent failed", { durationMs, error: message });
  }
}

/** Create a scoped logger for a specific agent and run */
export function createAgentLogger(agentName: string, runId: string): AgentLogger {
  return new AgentLogger(agentName, runId);
}
