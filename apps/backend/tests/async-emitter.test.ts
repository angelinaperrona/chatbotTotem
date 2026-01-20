import { describe, it, expect, mock } from "bun:test";
import { AsyncEventEmitter } from "../src/shared/events/async-emitter.ts";
import { EventBus } from "../src/shared/events/event-bus.ts";
import { createEvent } from "../src/shared/events/index.ts";

describe("AsyncEventEmitter", () => {
  it("should emit critical events synchronously", async () => {
    const eventBus = new EventBus();
    const emitter = new AsyncEventEmitter(eventBus);

    let called = false;
    eventBus.on("test", () => {
      called = true;
    });

    await emitter.emitCritical(createEvent("test", {}));

    expect(called).toBe(true);
  });

  it("should emit async events asynchronously", async () => {
    const eventBus = new EventBus();
    const emitter = new AsyncEventEmitter(eventBus);

    let called = false;
    eventBus.on("test", () => {
      called = true;
    });

    emitter.emitAsync(createEvent("test", {}));

    // Should not be called immediately
    expect(called).toBe(false);

    // Wait for next tick
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(called).toBe(true);
  });

  it("should log errors for async event handlers", async () => {
    const mockLogger = { error: mock(() => {}) } as any;

    const eventBus = new EventBus();
    const emitter = new AsyncEventEmitter(eventBus, mockLogger);

    let errorThrown = false;
    eventBus.on("test", () => {
      errorThrown = true;
      throw new Error("Test error");
    });

    emitter.emitAsync(createEvent("test", {}));

    await new Promise((resolve) => setTimeout(resolve, 0));

    // First verify the error was thrown
    expect(errorThrown).toBe(true);

    // Then check if logger was called
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
