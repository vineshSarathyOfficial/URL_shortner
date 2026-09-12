import dns from 'node:dns/promises';
import net from 'node:net';
import { request } from 'undici';
import { config } from '../config.js';
import { AppError } from '../errors.js';

const BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata.google.internal']);
const PRIVATE_CIDRS = [
  { family: 4, start: '127.0.0.0', mask: 8 },
  { family: 4, start: '10.0.0.0', mask: 8 },
  { family: 4, start: '172.16.0.0', mask: 12 },
  { family: 4, start: '192.168.0.0', mask: 16 },
  { family: 4, start: '169.254.0.0', mask: 16 },
];

function isPrivateIp(ip: string): boolean {
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd');
  }
  if (!net.isIPv4(ip)) return true;

  const parts = ip.split('.').map(Number);
  const ipNum = ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;

  for (const cidr of PRIVATE_CIDRS) {
    const [a, b, c, d] = cidr.start.split('.').map(Number);
    const network = ((a << 24) | (b << 16) | (c << 8) | d) >>> 0;
    const mask = (~0 << (32 - cidr.mask)) >>> 0;
    if ((ipNum & mask) === (network & mask)) return true;
  }
  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return BLOCKED_HOSTNAMES.has(lower) || lower.endsWith('.internal');
}

async function resolveAndCheck(hostname: string): Promise<void> {
  if (isBlockedHostname(hostname)) {
    throw new AppError('DESTINATION_UNREACHABLE', 'Destination is not reachable', 422);
  }
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    for (const addr of addresses) {
      if (isPrivateIp(addr.address)) {
        throw new AppError('DESTINATION_UNREACHABLE', 'Destination is not reachable', 422);
      }
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('DESTINATION_UNREACHABLE', 'Destination is not reachable', 422);
  }
}

function validateUrlFormat(url: string): URL {
  if (url.length > config.urlMaxLength) {
    throw new AppError('VALIDATION_ERROR', `URL exceeds maximum length of ${config.urlMaxLength}`, 422);
  }
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    throw new AppError('INVALID_URL', 'The provided URL is not valid.', 422);
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new AppError('INVALID_URL', 'Only HTTP and HTTPS URLs are supported.', 422);
  }
  return parsed;
}

export async function checkReachability(url: string): Promise<void> {
  try {
    let current = validateUrlFormat(url);
    let redirectCount = 0;

    while (true) {
      await resolveAndCheck(current.hostname);

      const response = await request(current.toString(), {
        method: 'HEAD',
        headers: { 'User-Agent': 'URLShortener-Validator/1.0' },
        headersTimeout: config.urlValidationTimeout,
        bodyTimeout: config.urlValidationTimeout,
      });

      let statusCode = response.statusCode;
      let activeResponse = response;

      if (statusCode === 405 || statusCode === 501) {
        const getResponse = await request(current.toString(), {
          method: 'GET',
          headers: { 'User-Agent': 'URLShortener-Validator/1.0' },
          headersTimeout: config.urlValidationTimeout,
          bodyTimeout: config.urlValidationTimeout,
        });
        statusCode = getResponse.statusCode;
        activeResponse = getResponse;
        await getResponse.body.dump();
      } else {
        await response.body.dump();
      }

      if ([301, 302, 303, 307, 308].includes(statusCode)) {
        redirectCount++;
        if (redirectCount > config.urlValidationRedirectLimit) {
          throw new AppError('DESTINATION_UNREACHABLE', 'Too many redirects', 422);
        }
        const location = activeResponse.headers.location;
        if (!location || Array.isArray(location)) {
          throw new AppError('DESTINATION_UNREACHABLE', 'Invalid redirect response', 422);
        }
        current = new URL(location, current);
        continue;
      }

      if (statusCode !== 200) {
        throw new AppError('DESTINATION_UNREACHABLE', 'Destination must return HTTP 200', 422);
      }
      return;
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      'DESTINATION_UNREACHABLE',
      'Could not reach this URL from our servers. Try a simpler URL or check that the site is publicly accessible.',
      422
    );
  }
}
