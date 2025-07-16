import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Make a request to google gemini
// (no memory of the past or RAG yet)
export async function POST(req) {
  try {
    const { messages } = await req.json();

    // Re-instantiate on every request
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Keep QPS < 3
    await new Promise((r) => setTimeout(r, 200));

    // Get user prompt + make stream
    const userPrompt = messages[messages.length - 1]?.parts?.[0]?.text ?? "";

    // TODO: This is probably where to add the RAG step to get more information
    //       and add it to the finalPrompt for the AI to use.
    //       Would also be cool to add a way for the AI to remember what is says
    const finalPrompt = `You are a helpful assistant for the UVA Career Center. Your job is to assist students sort through career information.

User Prompt: ${userPrompt}`;

    // Streamming
    const stream = await model.generateContentStream(finalPrompt);
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(ctrl) {
        try {
          for await (const chunk of stream.stream) {
            ctrl.enqueue(encoder.encode(chunk.text()));
          }
        } catch (err) {
          ctrl.enqueue(
            encoder.encode("\n\nStream interrupted: " + err.message),
          );
        } finally {
          ctrl.close();
        }
      },
    });

    // Return response to chat interface
    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    // Respond with an error
    console.error("Gemini error:", err);
    return NextResponse.json(
      { error: err.message ?? "LLM request failed" },
      { status: err.statusCode ?? 500 },
    );
  }
}
