// In-memory store standing in for the real database in this service.
export const users = new Map([
  ['u1', { id: 'u1', email: 'ana@example.com', role: 'admin', plan: 'pro' }],
  ['u2', { id: 'u2', email: 'ben@example.com', role: 'member', plan: 'free' }],
]);
export const links = new Map();
