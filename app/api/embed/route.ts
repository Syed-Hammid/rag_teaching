import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query, chunks } = await req.json();

    if (!query || !Array.isArray(chunks)) {
       return NextResponse.json({ error: 'Missing query or chunks array' }, { status: 400 });
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey || apiKey === 'your_nvidia_nim_api_key_here') {
       return NextResponse.json({ error: 'NVIDIA API key logic err' }, { status: 500 });
    }

    // Call A: embed the query alone with input_type: "query"
    const queryEmbRes = await fetch("https://integrate.api.nvidia.com/v1/embeddings", {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         "Authorization": `Bearer ${apiKey}`
       },
       body: JSON.stringify({
         input: [query],
         model: "nvidia/nv-embedqa-e5-v5",
         input_type: "query",
         encoding_format: "float",
         truncate: "END"
       })
    });

    if (!queryEmbRes.ok) {
       const err = await queryEmbRes.text();
       throw new Error(`Embedding query error: ${err}`);
    }

    const queryData = await queryEmbRes.json();
    const queryVector = queryData.data[0].embedding;

    // Call B: embed all chunk texts natively with input_type: "passage"
    let chunkVectors: number[][] = [];
    if (chunks.length > 0) {
       const chunksEmbRes = await fetch("https://integrate.api.nvidia.com/v1/embeddings", {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           "Authorization": `Bearer ${apiKey}`
         },
         body: JSON.stringify({
           input: chunks,
           model: "nvidia/nv-embedqa-e5-v5",
           input_type: "passage",
           encoding_format: "float",
           truncate: "END"
         })
       });

       if (!chunksEmbRes.ok) {
         const err = await chunksEmbRes.text();
         throw new Error(`Embedding chunks error: ${err}`);
       }

       const chunksData = await chunksEmbRes.json();
       // Map to preserve strict original index order natively
       chunkVectors = chunksData.data.sort((a: { index: number }, b: { index: number }) => a.index - b.index).map((d: { embedding: number[] }) => d.embedding);
    }
    
    return NextResponse.json({ queryVector, chunkVectors });

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Error occurred while embedding processing';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
