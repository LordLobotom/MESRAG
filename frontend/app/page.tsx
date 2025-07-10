"use client"

import { useChat } from "@ai-sdk/react"
import { Send, FileText, Paperclip, Menu, Settings, History, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"
import { useState } from "react"

export default function MesragChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Image src="/logo.png" alt="MESRAG Logo" width={32} height={32} className="rounded-lg" />
                <span className="font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 bg-clip-text text-transparent">
                  MESRAG
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="text-gray-500 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl"
              onClick={() => window.location.reload()}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 px-4">
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start text-gray-700 hover:bg-gray-100 rounded-xl">
                <History className="w-4 h-4 mr-3" />
                Chat History
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-700 hover:bg-gray-100 rounded-xl">
                <FileText className="w-4 h-4 mr-3" />
                Documents
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-700 hover:bg-gray-100 rounded-xl">
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">Industrial Document AI</p>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-25 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <div className="max-w-4xl mx-auto w-full h-screen flex flex-col p-4">
          {/* Header */}
          <div className="bg-white rounded-t-2xl p-6 border-b border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="text-gray-600 hover:bg-gray-100"
                >
                  <Menu className="w-5 h-5" />
                </Button>
                <Image src="/logo.png" alt="MESRAG Logo" width={48} height={48} className="rounded-lg" />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 bg-clip-text text-transparent">
                    MESRAG
                  </h1>
                  <p className="text-gray-600 text-sm">Industrial Document Assistant</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="text-gray-700 hover:bg-gray-100">
                  <FileText className="w-4 h-4 mr-2" />
                  Documents
                </Button>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 bg-white">
            <ScrollArea className="h-full p-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="bg-gray-50 rounded-2xl p-8 max-w-md border border-gray-100">
                    <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to MESRAG</h2>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Your intelligent assistant for industrial documents. Ask questions about your documents, get
                      insights, and streamline your workflow.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-4 ${
                          message.role === "user"
                            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                            : "bg-gray-50 text-gray-900 border border-gray-200"
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-50 text-gray-900 border border-gray-200 rounded-2xl p-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Input Area */}
          <div className="bg-white rounded-b-2xl p-6 border-t border-gray-100 shadow-sm">
            <form onSubmit={handleSubmit} className="flex items-center space-x-4">
              <Button type="button" variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100 shrink-0">
                <Paperclip className="w-4 h-4" />
              </Button>
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask about your industrial documents..."
                  className="bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 rounded-xl pr-12 focus:bg-white focus:border-gray-300"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white rounded-lg h-8 w-8 p-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
            <div className="flex items-center justify-center mt-3">
              <p className="text-gray-400 text-xs">Powered by AI • Industrial Document Intelligence</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
