// Encrypt a URL with the banner password, for use as a data-unlock-secret value.
// Usage: node encrypt.mjs "password" "https://example.com"
// Paste the printed string into data-unlock-secret="…" in index.html.

const [password, url] = process.argv.slice(2);
if (!password || !url) {
  console.error('Usage: node encrypt.mjs "password" "https://..."');
  process.exit(1);
}

const ITERATIONS = 600000;   // must match script.js
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));

const baseKey = await crypto.subtle.importKey(
  "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
  baseKey, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
const data = new Uint8Array(
  await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(url)));

// Output: salt + iv + encrypted URL, as one base64 string
console.log(Buffer.from([...salt, ...iv, ...data]).toString("base64"));
