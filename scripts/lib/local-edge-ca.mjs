import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import tls from "node:tls";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export const defaultLocalEdgeCaPath = path.resolve(
  currentDir,
  "../../deploy/docker/certs.local/caddy-local-root-ca.crt",
);

const defaultTrustState = {
  trusted: false,
};

export function createLocalEdgeCaTrustState() {
  return {
    trusted: false,
  };
}

export function isLocalEdgeHttpsUrl(targetUrl) {
  if (typeof targetUrl !== "string" || targetUrl.trim().length === 0) {
    return false;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    return false;
  }

  if (parsedUrl.protocol !== "https:") {
    return false;
  }

  const normalizedHost = parsedUrl.hostname.trim().toLowerCase();
  return (
    normalizedHost === "localhost" ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost === "::1" ||
    normalizedHost.endsWith(".localhost")
  );
}

export function resolveLocalEdgeCaPath(env = process.env) {
  const configuredPath = env.AIGCFOX_LOCAL_CA_CERT_PATH?.trim();
  return configuredPath && configuredPath.length > 0 ? configuredPath : defaultLocalEdgeCaPath;
}

export async function resolveLocalEdgeCaChildProcessEnv(targetUrl, options = {}) {
  if (!isLocalEdgeHttpsUrl(targetUrl)) {
    return {};
  }

  const fsImpl = options.fsImpl ?? fs;
  const env = options.env ?? process.env;
  const caPath = options.caPath ?? resolveLocalEdgeCaPath(env);

  try {
    await fsImpl.access(caPath);
    return {
      AIGCFOX_LOCAL_CA_CERT_PATH: caPath,
      NODE_EXTRA_CA_CERTS: caPath,
    };
  } catch {
    return {};
  }
}

export async function ensureLocalEdgeFetchTrust(targetUrl, options = {}) {
  const state = options.state ?? defaultTrustState;
  if (state.trusted) {
    return false;
  }

  if (!isLocalEdgeHttpsUrl(targetUrl)) {
    return false;
  }

  const tlsImpl = options.tlsImpl ?? tls;
  if (
    typeof tlsImpl.getCACertificates !== "function" ||
    typeof tlsImpl.setDefaultCACertificates !== "function"
  ) {
    return false;
  }

  const fsImpl = options.fsImpl ?? fs;
  const caPath = options.caPath ?? resolveLocalEdgeCaPath(options.env ?? process.env);

  try {
    const localEdgeCaPem = await fsImpl.readFile(caPath, "utf8");
    const defaultCaCertificates = tlsImpl.getCACertificates("default");

    if (!defaultCaCertificates.includes(localEdgeCaPem)) {
      tlsImpl.setDefaultCACertificates([...defaultCaCertificates, localEdgeCaPem]);
    }

    state.trusted = true;
    return true;
  } catch {
    return false;
  }
}
