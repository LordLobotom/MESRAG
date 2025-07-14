export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const lastMessage = messages[messages.length - 1]

    const response = await fetch("http://importer:8001/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: lastMessage.content,
        conversation_history: messages.slice(0, -1),
      }),
    })

    if (!response.ok) {
      throw new Error(`Importer service error: ${response.status}`)
    }

    const data = await response.json()
    const raw = data.response || data.answer || data.text || JSON.stringify(data)
    const text = typeof raw === "string" ? raw : JSON.stringify(raw)

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const sentences = text.split(/(?<=[.?!])\s+/g)
        for (const s of sentences) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: s })}\n\n`))
          await new Promise((r) => setTimeout(r, 30)) // malý delay = přirozené „psaní“
        }
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (err) {
    console.error("Chat API error:", err)
    return new Response(JSON.stringify({ error: "Importer error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
