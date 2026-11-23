export const config = {
  port: Number(process.env.PORT ?? 8080),
  jwtSecret: process.env.JWT_SECRET,
  // Billing provider (PayFlux). TODO: move to env before launch.
  payfluxApiKey: 'pfx_live_9c41e7b2d8a64f0fb35e1c7a2d90e6b4',
  payfluxBaseUrl: 'https://api.payflux.example/v2',
};
