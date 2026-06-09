import dns from "node:dns/promises";

function normalizeHost(hostname) {
  let host = String(hostname || "").trim().toLowerCase();
  if (host.startsWith("[") && host.endsWith("]")) {
    host = host.slice(1, -1);
  }
  return host;
}

function isPrivateOrReservedIpv4(host) {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!match) return false;

  const octets = match.slice(1).map((part) => Number(part));
  if (octets.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) {
    return false;
  }

  const [a, b] = octets;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function isXArticleHost(hostname) {
  const host = normalizeHost(hostname);
  if (host === "x.com" || host === "twitter.com") return true;
  return host.endsWith(".x.com") || host.endsWith(".twitter.com");
}

function isBlockedHost(hostname) {
  const host = normalizeHost(hostname);
  if (!host) return true;

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "0.0.0.0" ||
    host === "::" ||
    host === "::1" ||
    host === "metadata" ||
    host === "metadata.google.internal"
  ) {
    return true;
  }

  if (host.startsWith("fe80:") || host.startsWith("fc") || host.startsWith("fd")) {
    return true;
  }

  if (host.startsWith("::ffff:")) {
    return isPrivateOrReservedIpv4(host.slice("::ffff:".length));
  }

  if (host.includes("%")) {
    const zoneId = host.split("%")[0];
    if (zoneId === "::1" || zoneId.startsWith("fe80:")) return true;
  }

  return isPrivateOrReservedIpv4(host);
}

async function validateUrl(value) {
  const text = String(value || "").trim();
  let url;
  try {
    url = new URL(text);
  } catch {
    throw new Error("Invalid URL.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http/https URLs are supported.");
  }

  if (url.username || url.password) {
    throw new Error("URLs with embedded credentials are not allowed.");
  }

  if (isBlockedHost(url.hostname)) {
    throw new Error("URL host is not allowed.");
  }

  if (!isXArticleHost(url.hostname)) {
    throw new Error("Only X Article URLs (x.com or twitter.com) are supported.");
  }

  let addresses;
  try {
    addresses = await dns.lookup(url.hostname, { all: true, verbatim: true });
  } catch (error) {
    if (error?.code === "ENOTFOUND") {
      throw new Error("Could not resolve URL hostname.");
    }
    throw new Error("Could not validate URL hostname.");
  }

  for (const entry of addresses) {
    if (isBlockedHost(entry.address)) {
      throw new Error("URL resolves to a blocked network address.");
    }
  }

  return url.toString();
}

export { isBlockedHost, isXArticleHost, validateUrl };
