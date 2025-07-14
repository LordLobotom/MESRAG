export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Vezmi poslední zprávu od uživatele
    const lastMessage = messages[messages.length - 1]

    // Volání na váš importer service
    const response = await fetch("http://localhost:8001/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: lastMessage.content,
        conversation_history: messages.slice(0, -1),
      }),
    })

    if (!response.ok) {
      throw new Error(`Importer service error: ${response.status}`)
    }

    const data = await response.json()

    // Vrátíme odpověď jako stream pro UI
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        const text = data.response || data.answer || data.text || JSON.stringify(data)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response(JSON.stringify({ error: "Failed to connect to importer service" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// import { streamText } from "ai"
// import { createOllama } from "ollama-ai-provider"
// import { type NextRequest } from "next/server"

// const ollama = createOllama({
//   baseURL: "http://ollama:11434/api", // NE /api/chat – to už Ollama sama přidá
// })

// export async function POST(req: NextRequest) {
//   const { messages } = await req.json()

//   const result = await streamText({
//     model: ollama("deepseek-r1"),
//     messages,
//     system: `You are MESRAG, an intelligent assistant specialized in industrial documents and processes. 
// You help users understand, analyze, and extract insights from industrial documentation, technical manuals, 
// safety procedures, compliance documents, and operational guidelines. 

// Provide clear, accurate, and actionable responses. When discussing industrial processes, 
// prioritize safety and compliance. Be concise but thorough in your explanations.

// Always respond in the same language as the user's question.`,
//   })

//   return result.toAIStreamResponse()
// }