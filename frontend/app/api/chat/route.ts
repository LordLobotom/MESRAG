import { streamText } from "ai"
import { createOllama } from "ollama-ai-provider"

const ollama = createOllama({
  baseURL: "http://localhost:11434/api",
})

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = await streamText({
    model: ollama("deepseek-r1"),
    system: `You are MESRAG, an intelligent assistant specialized in industrial documents and processes. 
    You help users understand, analyze, and extract insights from industrial documentation, technical manuals, 
    safety procedures, compliance documents, and operational guidelines. 
    
    Provide clear, accurate, and actionable responses. When discussing industrial processes, 
    prioritize safety and compliance. Be concise but thorough in your explanations.
    
    Always respond in the same language as the user's question.`,
    messages,
  })

  return result.toDataStreamResponse()
}
