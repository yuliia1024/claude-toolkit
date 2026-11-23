export interface CompletionRequest {
  system: string;
  user: string;
  maxTokens: number;
  temperature: number;
}

export interface LlmClient {
  complete(req: CompletionRequest): Promise<string>;
}

/** Real client. Needs LLM_API_KEY; throws without it. */
export class HttpLlmClient implements LlmClient {
  constructor(private readonly apiKey = process.env.LLM_API_KEY) {
    if (!this.apiKey) throw new Error('LLM_API_KEY is not set');
  }

  async complete(req: CompletionRequest): Promise<string> {
    const res = await fetch(process.env.LLM_URL ?? 'https://llm.internal.example/v1/complete', {
      method: 'POST',
      headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
    const body = (await res.json()) as { text: string };
    return body.text;
  }
}
