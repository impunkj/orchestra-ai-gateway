import { Request, Response, NextFunction } from 'express';

/**
 * High-Performance API Key Validation Gatekeeper.
 * Blocks unauthorized connection handshakes before they can drain AI compute credits.
 */
export const apiKeyGuard = (req: Request, res: Response, next: NextFunction): void => {
  // Extract the custom token from the incoming request headers
  const incomingApiKey = req.headers['x-api-key'];
  const configuredSystemKey = process.env.GATEWAY_API_KEY;

  // 1. Structural Validation: Ensure the system itself has a key configured
  if (!configuredSystemKey) {
    console.error('[Auth-Middleware Error]: GATEWAY_API_KEY is not defined in environment configurations.');
    res.status(500).json({ error: 'Security subsystem misconfiguration.' });
    return;
  }

  // 2. Authentication Gate: If the token is missing or doesn't match, reject instantly
  if (!incomingApiKey || incomingApiKey !== configuredSystemKey) {
    console.warn(`[Unauthorized Access Attempt]: Blocked request from IP ${req.ip} targeting ${req.originalUrl}`);
    res.status(401).json({ error: 'Access denied. Valid and mandatory x-api-key header missing.' });
    return;
  }

  // 3. Authorization Success: Pass control to the next route handler in line
  next();
};