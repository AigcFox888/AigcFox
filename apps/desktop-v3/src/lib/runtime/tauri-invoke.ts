export type TauriInvoke = <TResult>(
  command: string,
  payload?: Record<string, unknown>,
) => Promise<TResult>;
