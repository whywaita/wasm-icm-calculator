import type {
  CalculationInput,
  CalculationResult,
  WorkerResponse,
} from "./types";

export class EngineClient {
  private worker: Worker | null = null;

  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL("./worker.ts", import.meta.url), {
        type: "module",
      });
    }
    return this.worker;
  }

  calculate(input: CalculationInput): Promise<CalculationResult> {
    return new Promise((resolve, reject) => {
      const worker = this.getWorker();

      const handler = (event: MessageEvent<WorkerResponse>) => {
        worker.removeEventListener("message", handler);
        worker.removeEventListener("error", errorHandler);

        if (event.data.type === "result") {
          resolve(event.data.data);
        } else {
          reject(new Error(event.data.error));
        }
      };

      const errorHandler = (event: ErrorEvent) => {
        worker.removeEventListener("message", handler);
        worker.removeEventListener("error", errorHandler);
        reject(new Error(event.message || "Worker error"));
      };

      worker.addEventListener("message", handler);
      worker.addEventListener("error", errorHandler);

      worker.postMessage({ type: "calculate", data: input });
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
