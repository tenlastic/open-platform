/// <reference lib="webworker" />

addEventListener('message', async ({ data }) => {
  const { accessToken, url } = data;

  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const blob = await response.blob();

  postMessage({ blob, url });
});
