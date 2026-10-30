// Vercel serverless entrypoint. The shared Express application keeps local and
// deployed API behaviour identical while Vercel manages the HTTP listener.
export { default } from '../server.js';
