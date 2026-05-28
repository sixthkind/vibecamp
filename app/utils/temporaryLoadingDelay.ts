export async function temporaryLoadingDelay(ms = 1500) {
  if (!import.meta.dev) return;

  await new Promise((resolve) => setTimeout(resolve, ms));
}
