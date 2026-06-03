import NodeCache from 'node-cache';

// Initialize a local in-memory cache with a default expiration of 5 minutes (300 seconds)
export const gatewayCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

console.log(' [Gateway-Cache] In-memory storage layer initialized successfully.');