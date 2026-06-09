function summarizePrompt(markdown, sourceUrl = "") {
  return [
    "Summarize this article for an operator who wants fast, reusable notes.",
    "Return plain Markdown only. Do not wrap the response in a code fence.",
    "Return Markdown with these sections:",
    "## TL;DR",
    "## Key Points",
    "## Claims To Verify",
    "## Practical Takeaways",
    sourceUrl ? `Source URL: ${sourceUrl}` : "",
    "",
    markdown
  ]
    .filter(Boolean)
    .join("\n");
}

function chatPrompt({ articleMarkdown, summaryMarkdown, messages = [], question }) {
  const conversation = messages
    .slice(-8)
    .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`)
    .join("\n");

  return [
    "You are answering follow-up questions about one scraped article.",
    "Use only the article and summary context unless the user explicitly asks for outside reasoning.",
    "Keep answers concise, practical, and grounded. Return HTML-safe plain text or simple Markdown, without code fences.",
    "",
    "ARTICLE:",
    articleMarkdown,
    "",
    "SUMMARY:",
    summaryMarkdown,
    "",
    "RECENT CHAT:",
    conversation || "(none)",
    "",
    "QUESTION:",
    question
  ].join("\n");
}

export { chatPrompt, summarizePrompt };
