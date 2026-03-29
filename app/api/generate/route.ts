import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query, chunks } = await req.json();

    if (!query || !Array.isArray(chunks)) {
      return NextResponse.json(
        { error: 'Invalid payload: expected { query: string, chunks: string[] }' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey || apiKey === 'your_nvidia_nim_api_key_here') {
      return NextResponse.json(
        { error: 'NVIDIA API key is missing or not configured in .env.local.' },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "meta/llama-3.3-70b-instruct",
          messages: [
            {
              role: "system",
              content: "You are a knowledgeable assistant. Answer the user's question clearly and comprehensively using the provided context. The context comes from Wikipedia articles. Synthesize the information naturally — do not just repeat the context, explain it well. If the context partially answers the question, use what is available and note any gaps."
            },
            {
              role: "user",
              content: `Context:\n${chunks.join("\n\n")}\n\nQuestion: ${query}\n\nAnswer:`
            }
          ],
          temperature: 0.5,
          max_tokens: 512,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `NVIDIA API error ${response.status}: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ answer: data.choices[0].message.content });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
