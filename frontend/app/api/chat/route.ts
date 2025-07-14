export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const lastMessage = messages[messages.length - 1]

    console.log("Frontend: Sending request to backend with query:", lastMessage.content)

    const backendUrl = process.env.BACKEND_URL || "http://backend:8001";

    const response = await fetch(backendUrl + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: lastMessage.content,
        conversation_history: messages.slice(0, -1),
      }),
    })

    if (!response.ok) {
      throw new Error(`Backend service error: ${response.status}`)
    }

    const data = await response.json()
    console.log("Frontend: Received data from backend:", data)
    
    // Správné zpracování ChatResponse objektu
    let text = ""
    if (data.response) {
      text = data.response
    } else if (data.answer) {
      text = data.answer
    } else if (data.text) {
      text = data.text
    } else {
      text = JSON.stringify(data)
    }

    // Ujisti se, že text je string
    if (typeof text !== "string") {
      text = String(text)
    }

    // Odfiltruj <think> bloky z DeepSeek-R1 odpovědi
    text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()

    console.log("Frontend: Filtered text:", text)
    console.log("Frontend: Text length:", text.length)

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        console.log("Frontend: Starting stream")
        
        // Pokud je text prázdný, pošli chybovou zprávu
        if (!text || text.length === 0) {
          console.log("Frontend: Empty text, sending error")
          const errorMsg = "Nepodařilo se získat odpověď z modelu."
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: errorMsg })}\n\n`))
          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
          return
        }
        
        // Rozdělení na věty pro plynulé zobrazení
        const sentences = text.split(/(?<=[.?!])\s+/g).filter(s => s.trim())
        console.log("Frontend: Split into sentences:", sentences.length)
        
        for (let i = 0; i < sentences.length; i++) {
          const sentence = sentences[i]
          console.log(`Frontend: Sending sentence ${i + 1}/${sentences.length}:`, sentence.substring(0, 50) + "...")
          
          const chunk = `data: ${JSON.stringify({ content: sentence + " " })}\n\n`
          controller.enqueue(encoder.encode(chunk))
          await new Promise((resolve) => setTimeout(resolve, 100)) // Zpomalení pro debug
        }
        
        console.log("Frontend: Stream finished, sending [DONE]")
        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (err) {
    console.error("Frontend: Chat API error:", err)
    
    // Vrátit chybovou zprávu jako stream
    const errorText = `Omlouvám se, došlo k chybě při zpracování vašeho dotazu: ${err.message}`
    const encoder = new TextEncoder()
    
    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: errorText })}\n\n`))
        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()
      },
    })
    
    return new Response(errorStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  }
}