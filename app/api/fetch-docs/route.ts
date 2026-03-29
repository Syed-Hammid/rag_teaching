import { NextResponse } from 'next/server';

export interface ChunkObject {
  id: string;
  source: string;
  text: string;
  url: string;
}

function chunkText(text: string, title: string, maxLen = 300): ChunkObject[] {
  // basic sentence splitting preserving punctuation
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) || [text];
  
  const chunks: ChunkObject[] = [];
  let currentChunk = "";
  let chunkIdx = 0;

  for (let sentence of sentences) {
    sentence = sentence.trim();
    if (!sentence) continue;

    if (currentChunk.length + sentence.length > maxLen && currentChunk.length > 0) {
      chunks.push({
        id: `wiki-${title.replace(/\s+/g, '-')}-${chunkIdx++}`,
        source: title,
        text: currentChunk.trim(),
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`
      });
      currentChunk = sentence;
      if (chunks.length >= 2) break;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
    }
  }
  
  if (currentChunk.trim() && chunks.length < 2) {
    chunks.push({
      id: `wiki-${title.replace(/\s+/g, '-')}-${chunkIdx++}`,
      source: title,
      text: currentChunk.trim(),
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`
    });
  }
  
  return chunks;
}

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    // Step 1: Search Wikipedia titles
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=5&utf8=1&format=json&origin=*`,
      { headers: { 'User-Agent': 'RAGInteractiveDemoApp/1.0 (Educational RAG Pipeline Demo)' } }
    );
    const searchData = await searchRes.json();
    
    const searchResults = searchData?.query?.search || [];
    if (searchResults.length === 0) {
      return NextResponse.json({ chunks: [] });
    }

    // Step 2: Fetch summaries for top 5 titles in parallel
    const summariesPromises = searchResults.map(async (item: { title: string }) => {
      try {
        const pageRes = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.title)}`,
          { headers: { 'User-Agent': 'RAGInteractiveDemoApp/1.0 (Educational RAG Pipeline Demo)' } }
        );
        if (!pageRes.ok) return null;
        const pageData = await pageRes.json();
        return { title: pageData.title, extract: pageData.extract };
      } catch {
        return null;
      }
    });

    const pages = (await Promise.all(summariesPromises)).filter(Boolean);
    
    // Step 3: Chunk and assemble flat array
    const allChunks: ChunkObject[] = [];
    for (const page of pages) {
      if (page && page.extract) {
        const extractedChunks = chunkText(page.extract, page.title);
        allChunks.push(...extractedChunks);
      }
    }

    return NextResponse.json({ chunks: allChunks });

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error fetching documents';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
