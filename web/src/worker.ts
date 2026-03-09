import type { WorkerRequest, WorkerResponse } from "./types";

let initialized = false;
let initPromise: Promise<void> | null = null;

async function initWasm(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const wasm = await import("../pkg/icm_engine.js");
      await wasm.default();
      initialized = true;
    } catch (e) {
      initPromise = null;
      throw new Error(
        `Failed to load WASM module: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  })();

  return initPromise;
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { type, data } = event.data;

  if (type !== "calculate") {
    const response: WorkerResponse = {
      type: "error",
      error: `Unknown message type: ${type}`,
    };
    self.postMessage(response);
    return;
  }

  try {
    await initWasm();

    const { calculate } = await import("../pkg/icm_engine.js");
    const inputJson = JSON.stringify(data);
    const resultJson = calculate(inputJson);
    const result = JSON.parse(resultJson);

    const response: WorkerResponse = { type: "result", data: result };
    self.postMessage(response);
  } catch (e) {
    const response: WorkerResponse = {
      type: "error",
      error: e instanceof Error ? e.message : String(e),
    };
    self.postMessage(response);
  }
};
