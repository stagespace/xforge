async function scrapeToMarkdown(url) {
  const baseUrl = requiredEnv("FIRECRAWL_API_URL").replace(/\/+$/, "");
  const apiKey = requiredEnv("FIRECRAWL_API_KEY");
  const response = await fetch(`${baseUrl}/v1/scrape`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: false,
      waitFor: 5000
    })
  });

  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`Firecrawl returned non-JSON HTTP ${response.status}: ${text.slice(0, 400)}`);
  }
  if (!response.ok || !payload.success) {
    throw new Error(`Firecrawl failed HTTP ${response.status}: ${JSON.stringify(payload).slice(0, 800)}`);
  }
  return payload.data || {};
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export { scrapeToMarkdown };
