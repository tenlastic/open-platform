export async function retryOnError(delay: number, threshold: number, callback: () => any) {
  for (let i = 0; i < threshold; i++) {
    try {
      return await callback();
    } catch (e) {
      await new Promise(resolve => setTimeout(resolve, delay));

      if (i === threshold - 1) {
        throw e;
      }
    }
  }
}
