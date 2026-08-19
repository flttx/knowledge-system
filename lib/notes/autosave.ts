export interface AutosaveQueue {
  enqueue<TResult>(task: () => Promise<TResult>): Promise<TResult>;
}

export function createAutosaveQueue(): AutosaveQueue {
  let queue: Promise<void> = Promise.resolve();

  return {
    enqueue<TResult>(task: () => Promise<TResult>): Promise<TResult> {
      const result = queue.then(task);
      queue = result.then(() => undefined, () => undefined);
      return result;
    },
  };
}
