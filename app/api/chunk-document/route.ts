import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, filename } = await req.json();

    if (!text || !filename) {
      return NextResponse.json({ error: 'Missing text or filename' }, { status: 400 });
    }

    // 1. Clean the text: normalize whitespace, remove excessive line breaks
    const cleanText = text.replace(/\s+/g, ' ').trim();

    // 2. Split into sentences grouping boundaries
    const rawSentences = cleanText.split(/(?<=[.!?])\s+(?=[A-Z])/);
    const sentences = rawSentences.map((s: string) => s.trim()).filter((s: string) => s.length > 0);

    const chunks: string[] = [];
    let currentChunk = "";
    let lastSentence = "";
    
    // 3. Group sentences aiming for 300-400 chars. 4. Min 50 chars skip tiny fragments.
    for (let i = 0; i < sentences.length; i++) {
       const sentence = sentences[i];
       
       if (currentChunk.length + sentence.length > 350 && currentChunk.length >= 50) {
          chunks.push(currentChunk.trim());
          // 5. Apply sliding window overlapping
          currentChunk = lastSentence ? (lastSentence + " " + sentence) : sentence;
       } else {
          currentChunk += (currentChunk ? " " : "") + sentence;
       }
       lastSentence = sentence;
    }
    
    if (currentChunk.trim().length >= 50 || chunks.length === 0) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
    }

    const finalChunks = chunks.filter(c => c.length >= 50 || chunks.length === 1);

    // 6. Return mapped response
    const mappedChunks = finalChunks.map((t, i) => ({
       id: `doc-chunk-${i}`,
       source: filename,
       text: t,
       chunkIndex: i + 1,
       totalChunks: finalChunks.length
    }));

    return NextResponse.json({ chunks: mappedChunks });

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error chunking document';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
