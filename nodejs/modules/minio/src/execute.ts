const TIMEOUT = 1000;
const TIMEOUT_LIMIT = 64000;

export interface ExecuteOptions {
  codes?: string[];
  timeout?: number;
}

export async function execute<T>(callback: () => Promise<T>, options?: ExecuteOptions): Promise<T> {
  const codes = options?.codes ? [...options.codes, 'SlowDown'] : ['SlowDown'];
  const timeout = options?.timeout ? options.timeout : TIMEOUT;

  try {
    return await callback();
  } catch (e) {
    if (!codes.includes(e.code)) {
      throw e;
    }

    if (timeout > TIMEOUT_LIMIT) {
      throw e;
    }

    await new Promise((resolve) => setTimeout(resolve, timeout));

    return execute(callback, { ...options, timeout: timeout * timeout });
  }
}
