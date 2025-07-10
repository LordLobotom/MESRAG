import { streamText } from "ai"
import { createOllama } from "ollama-ai-provider"
import { type NextRequest } from "next/server"

const ollama = createOllama({
  baseURL: "http://ollama:11434/api", // NE /api/chat – to už Ollama sama přidá
})

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const result = await streamText({
    model: ollama("deepseek-r1"),
    messages,
    system: `You are MESRAG, an intelligent assistant specialized in industrial documents and processes. 
You help users understand, analyze, and extract insights from industrial documentation, technical manuals, 
safety procedures, compliance documents, and operational guidelines. 

Provide clear, accurate, and actionable responses. When discussing industrial processes, 
prioritize safety and compliance. Be concise but thorough in your explanations.

Always respond in the same language as the user's question.`,
  })

  return result.toAIStreamResponse()
}