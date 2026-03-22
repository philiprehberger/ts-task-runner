import type { RunnerOptions } from './types';

interface Task {
  name: string;
  fn: () => Promise<void> | void;
  deps: string[];
}

export function createRunner(options?: RunnerOptions) {
  const tasks = new Map<string, Task>();
  const { onStart, onComplete, onError } = options ?? {};

  function task(name: string, fn: () => Promise<void> | void, deps?: string[]) {
    tasks.set(name, { name, fn, deps: deps ?? [] });
  }

  function topologicalSort(targetName?: string): string[] {
    const relevant = new Map<string, Task>();

    if (targetName) {
      const collect = (name: string) => {
        if (relevant.has(name)) return;
        const t = tasks.get(name);
        if (!t) throw new Error(`Missing dependency: ${name}`);
        relevant.set(name, t);
        for (const dep of t.deps) collect(dep);
      };
      collect(targetName);
    } else {
      for (const [name, t] of tasks) {
        relevant.set(name, t);
      }
    }

    // Validate all deps exist
    for (const [, t] of relevant) {
      for (const dep of t.deps) {
        if (!relevant.has(dep)) {
          throw new Error(`Missing dependency: ${dep}`);
        }
      }
    }

    // Kahn's algorithm
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const [name] of relevant) {
      inDegree.set(name, 0);
      adjacency.set(name, []);
    }

    for (const [name, t] of relevant) {
      for (const dep of t.deps) {
        adjacency.get(dep)!.push(name);
        inDegree.set(name, (inDegree.get(name) ?? 0) + 1);
      }
    }

    const queue: string[] = [];
    for (const [name, degree] of inDegree) {
      if (degree === 0) queue.push(name);
    }

    const sorted: string[][] = [];

    while (queue.length > 0) {
      const batch = [...queue];
      queue.length = 0;
      sorted.push(batch);

      for (const name of batch) {
        for (const dependent of adjacency.get(name)!) {
          const newDegree = inDegree.get(dependent)! - 1;
          inDegree.set(dependent, newDegree);
          if (newDegree === 0) queue.push(dependent);
        }
      }
    }

    const flatSorted = sorted.flat();
    if (flatSorted.length !== relevant.size) {
      throw new Error('Circular dependency detected');
    }

    return flatSorted;
  }

  function topologicalSortBatched(targetName?: string): string[][] {
    const relevant = new Map<string, Task>();

    if (targetName) {
      const collect = (name: string) => {
        if (relevant.has(name)) return;
        const t = tasks.get(name);
        if (!t) throw new Error(`Missing dependency: ${name}`);
        relevant.set(name, t);
        for (const dep of t.deps) collect(dep);
      };
      collect(targetName);
    } else {
      for (const [name, t] of tasks) {
        relevant.set(name, t);
      }
    }

    for (const [, t] of relevant) {
      for (const dep of t.deps) {
        if (!relevant.has(dep)) {
          throw new Error(`Missing dependency: ${dep}`);
        }
      }
    }

    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const [name] of relevant) {
      inDegree.set(name, 0);
      adjacency.set(name, []);
    }

    for (const [name, t] of relevant) {
      for (const dep of t.deps) {
        adjacency.get(dep)!.push(name);
        inDegree.set(name, (inDegree.get(name) ?? 0) + 1);
      }
    }

    const queue: string[] = [];
    for (const [name, degree] of inDegree) {
      if (degree === 0) queue.push(name);
    }

    const batches: string[][] = [];

    while (queue.length > 0) {
      const batch = [...queue];
      queue.length = 0;
      batches.push(batch);

      for (const name of batch) {
        for (const dependent of adjacency.get(name)!) {
          const newDegree = inDegree.get(dependent)! - 1;
          inDegree.set(dependent, newDegree);
          if (newDegree === 0) queue.push(dependent);
        }
      }
    }

    const totalCount = batches.reduce((sum, b) => sum + b.length, 0);
    if (totalCount !== relevant.size) {
      throw new Error('Circular dependency detected');
    }

    return batches;
  }

  async function run(targetName?: string): Promise<void> {
    const batches = topologicalSortBatched(targetName);

    for (const batch of batches) {
      await Promise.all(
        batch.map(async (name) => {
          const t = tasks.get(name)!;
          onStart?.(name);
          try {
            await t.fn();
            onComplete?.(name);
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            onError?.(name, error);
            throw error;
          }
        })
      );
    }
  }

  function dryRun(targetName?: string): string[] {
    return topologicalSort(targetName);
  }

  return { task, run, dryRun };
}
