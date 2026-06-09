import { config } from "./config.js";

async function fireworksChatCompletion({ model, userPrompt, maxTokens = 2048 }) {
  const apiKey = config.fireworksApiKey;
  if (!apiKey) {
    throw new Error("Missing required environment variable: FIREWORKS_API");
  }

  const response = await fetch(`${config.fireworksBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: userPrompt }],
      max_tokens: maxTokens,
      temperature: 0.4
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || JSON.stringify(payload).slice(0, 400);
    throw new Error(`Fireworks failed HTTP ${response.status}: ${message}`);
  }

  const text = payload?.choices?.[0]?.message?.content || "";
  return { model, text };
}

export { fireworksChatCompletion };
