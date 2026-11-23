import type { CompletionRequest, LlmClient } from './client.js';

/**
 * Offline stand-in for the real model: crude keyword routing, so pipelines and eval
 * harnesses can run without an API key. Its answers are NOT representative of model quality.
 */
export class StubLlmClient implements LlmClient {
  async complete(req: CompletionRequest): Promise<string> {
    const text = req.user.toLowerCase();
    const pick = (category: string, urgency: string) => JSON.stringify({ category, urgency });
    if (/refund|charged|invoice|card/.test(text)) return pick('billing', 'normal');
    if (/password|login|2fa|locked out/.test(text)) return pick('account', 'normal');
    if (/error|crash|500|broken|bug/.test(text)) return pick('bug', 'high');
    if (/please add|would be nice|feature/.test(text)) return pick('feature_request', 'low');
    return pick('other', 'low');
  }
}
