import { useEffect, useRef, useState } from "preact/hooks";
import { EngineClient } from "../engine";
import type { CalculationInput, CalculationResult } from "../types";

export function useEngine() {
  const clientRef = useRef<EngineClient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);

  useEffect(() => {
    clientRef.current = new EngineClient();
    return () => {
      clientRef.current?.terminate();
      clientRef.current = null;
    };
  }, []);

  const calculate = async (input: CalculationInput) => {
    if (!clientRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await clientRef.current.calculate(input);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  };

  return { calculate, isLoading, error, result };
}
