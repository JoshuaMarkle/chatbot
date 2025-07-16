/*  src/app/api/chat/route.js  ----------------------------------- */
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { messages } = await req.json();

    /* 1️⃣  Re‑instantiate on every request */
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    /* 2️⃣  (Optional) keep QPS < 3 */
    await new Promise((r) => setTimeout(r, 200));

    const userPrompt = messages[messages.length - 1]?.parts?.[0]?.text ?? "";
    const stream = await model.generateContentStream(userPrompt);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(ctrl) {
        try {
          for await (const chunk of stream.stream) {
            ctrl.enqueue(encoder.encode(chunk.text()));
          }
        } catch (err) {
          ctrl.enqueue(
            encoder.encode("\n\n❌ Stream interrupted: " + err.message),
          );
        } finally {
          ctrl.close();
        }
      },
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Gemini error →", err);
    return NextResponse.json(
      { error: err.message ?? "LLM request failed" },
      { status: err.statusCode ?? 500 },
    );
  }
}
