export interface TaskDef {
  name: string;
  fn: () => Promise<void> | void;
  deps?: string[];
}

export interface RunnerOptions {
  onStart?: (name: string) => void;
  onComplete?: (name: string) => void;
  onError?: (name: string, error: Error) => void;
}
