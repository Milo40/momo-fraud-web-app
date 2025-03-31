"use client";

import type React from "react";
import axios from "axios";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Image, FileText, Send, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SettingsDialog } from "./settings-dialog";
import { Spinner } from "@/components/spinner";
import { InitialChatForm } from "@/components/initial-chat-form";
import { MarkdownRenderer } from "@/components/markdown-renderer";

const INITIAL_MESSAGE_ENDPOINT =
  process.env.NEXT_PUBLIC_INITIAL_MESSAGE_ENDPOINT ?? "";
const FOLLOW_UP_MESSAGE_ENDPOINT =
  process.env.NEXT_PUBLIC_FOLLOW_UP_MESSAGE_ENDPOINT ?? "";

const api = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

interface Message {
  role: "user" | "assistant";
  content: string;
  senderName?: string;
  isMarkdown?: boolean;
  tags?: string[];
  probability?: number;
  description?: string;
}

interface Conversation {
  id: number;
  title: string;
  messages: Message[];
}

export function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number>(1);
  const [input, setInput] = useState("");
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversation IDs from localStorage on component mount
  useEffect(() => {
    const storedConversationIds = localStorage.getItem("conversationIds");
    if (storedConversationIds) {
      try {
        const parsedIds = JSON.parse(storedConversationIds);
        console.log("Loaded conversation IDs from localStorage:", parsedIds);
      } catch (err) {
        console.error("Error parsing stored conversation IDs:", err);
      }
    }
  }, []);

  const currentConversation =
    conversations.find((conv) => conv.id === currentConversationId) ||
    (conversations.length > 0
      ? conversations[0]
      : {
          id: 0,
          title: "New Chat",
          messages: [],
        });

  const isNewChat = currentConversation.messages.length === 0;

  // Helper function to save backend conversation ID to localStorage
  const saveBackendConversationId = (
    frontendConvId: number,
    backendConvId: string
  ) => {
    try {
      // Get existing mapping or initialize new one
      const storedIds = localStorage.getItem("conversationIds") || "{}";
      const conversationIds = JSON.parse(storedIds);

      // Update the mapping
      conversationIds[frontendConvId] = backendConvId;

      // Save back to localStorage
      localStorage.setItem("conversationIds", JSON.stringify(conversationIds));
      console.log(
        `Saved backend ID ${backendConvId} for conversation ${frontendConvId}`
      );
    } catch (err) {
      console.error("Error saving conversation ID to localStorage:", err);
    }
  };

  // Helper function to get backend conversation ID from localStorage
  const getBackendConversationId = (frontendConvId: number): string | null => {
    try {
      const storedIds = localStorage.getItem("conversationIds");
      if (!storedIds) return null;

      const conversationIds = JSON.parse(storedIds);
      return conversationIds[frontendConvId] || null;
    } catch (err) {
      console.error("Error retrieving conversation ID from localStorage:", err);
      return null;
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log("Selected image:", files[0]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log("Selected file:", files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setError(null);

      // Add user message to conversation
      const newMessage: Message = { role: "user", content: input.trim() };
      const updatedConversations = conversations.map((conv) =>
        conv.id === currentConversationId
          ? { ...conv, messages: [...conv.messages, newMessage] }
          : conv
      );
      setConversations(updatedConversations);
      setInput("");

      // Show loading spinner
      setIsLoading(true);

      try {
        // Get the backend conversation ID for the current frontend conversation
        const backendConversationId = getBackendConversationId(
          currentConversationId
        );

        if (!backendConversationId) {
          throw new Error(
            "No backend conversation ID found. Please start a new conversation."
          );
        }

        // Send message to follow-up endpoint using axios
        const response = await api.post(FOLLOW_UP_MESSAGE_ENDPOINT, {
          question: input.trim(),
          user_id: backendConversationId, // Use the backend-generated ID
        });

        const data = response.data;

        // Add AI response to conversation
        const aiResponse: Message = {
          role: "assistant",
          content:
            data.result?.answer || data.message || "No response received.",
          isMarkdown: true,
        };

        const updatedConversationsWithAI = updatedConversations.map((conv) =>
          conv.id === currentConversationId
            ? { ...conv, messages: [...conv.messages, aiResponse] }
            : conv
        );
        setConversations(updatedConversationsWithAI);
      } catch (err) {
        console.error("Error sending message:", err);

        // Get error message from axios error
        let errorMessage = "Failed to send message. Please try again.";
        if (axios.isAxiosError(err)) {
          errorMessage =
            err.response?.data?.message || err.message || errorMessage;
        }

        setError(errorMessage);

        // Add error message to conversation
        const errorResponse: Message = {
          role: "assistant",
          content:
            "Sorry, there was an error processing your request. Please try again.",
        };

        const updatedConversationsWithError = updatedConversations.map((conv) =>
          conv.id === currentConversationId
            ? { ...conv, messages: [...conv.messages, errorResponse] }
            : conv
        );
        setConversations(updatedConversationsWithError);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleInitialSubmit = async (senderName: string, message: string) => {
    setError(null);

    // Create a new message with the sender name
    const newMessage: Message = {
      role: "user",
      content: message,
      senderName: senderName,
    };

    // Update the conversation title based on the first few words of the message
    const title =
      message.length > 30 ? message.substring(0, 30) + "..." : message;

    const updatedConversations = conversations.map((conv) =>
      conv.id === currentConversationId
        ? {
            ...conv,
            title: title,
            messages: [...conv.messages, newMessage],
          }
        : conv
    );

    setConversations(updatedConversations);

    // Show loading spinner
    setIsLoading(true);

    try {
      // Send initial message to API using axios
      const response = await api.post(INITIAL_MESSAGE_ENDPOINT, {
        message: message,
        from: senderName,
      });

      const data = response.data;

      // Extract the result data
      const result = data.result || {};

      // Store the backend-generated user_id in localStorage
      const backendConversationId = data.user_id || result.user_id;
      if (backendConversationId) {
        saveBackendConversationId(currentConversationId, backendConversationId);
      } else {
        console.error("No user_id found in API response");
      }

      // Add AI response to conversation with markdown content
      const aiResponse: Message = {
        role: "assistant",
        content:
          result.long_description || data.message || "No response received.",
        isMarkdown: true,
        tags: result.tags || [],
        probability: result.probability,
        description: result.description,
      };

      const updatedConversationsWithAI = updatedConversations.map((conv) =>
        conv.id === currentConversationId
          ? { ...conv, messages: [...conv.messages, aiResponse] }
          : conv
      );
      setConversations(updatedConversationsWithAI);
    } catch (err) {
      console.error("Error sending initial message:", err);

      // Get error message from axios error
      let errorMessage = "Failed to send message. Please try again.";
      if (axios.isAxiosError(err)) {
        errorMessage =
          err.response?.data?.message || err.message || errorMessage;
      }

      setError(errorMessage);

      // Add error message to conversation
      const errorResponse: Message = {
        role: "assistant",
        content:
          "Sorry, there was an error processing your request. Please try again.",
      };

      const updatedConversationsWithError = updatedConversations.map((conv) =>
        conv.id === currentConversationId
          ? { ...conv, messages: [...conv.messages, errorResponse] }
          : conv
      );
      setConversations(updatedConversationsWithError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkInsert = () => {
    if (linkUrl) {
      const newText = input + ` [link](${linkUrl})`;
      setInput(newText);
      setLinkUrl("");
      setIsLinkDialogOpen(false);
    }
  };

  const handleConversationChange = (id: number) => {
    setCurrentConversationId(id);
  };

  const deleteConversation = (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Prevent triggering the conversation selection

    // Remove the backend conversation ID from localStorage when deleting
    try {
      const storedIds = localStorage.getItem("conversationIds");
      if (storedIds) {
        const conversationIds = JSON.parse(storedIds);
        if (conversationIds[id]) {
          delete conversationIds[id];
          localStorage.setItem(
            "conversationIds",
            JSON.stringify(conversationIds)
          );
          console.log(`Removed backend ID for conversation ${id}`);
        }
      }
    } catch (err) {
      console.error("Error removing conversation ID from localStorage:", err);
    }

    // Filter out the conversation to be deleted
    const updatedConversations = conversations.filter((conv) => conv.id !== id);

    // If there are no conversations left, create a new empty one
    if (updatedConversations.length === 0) {
      const newConversation = {
        id: 1,
        title: "New Chat",
        messages: [],
      };
      setConversations([newConversation]);
      setCurrentConversationId(1);
      return;
    }

    // If the current conversation is being deleted, switch to another one
    if (id === currentConversationId) {
      setCurrentConversationId(updatedConversations[0].id);
    }

    setConversations(updatedConversations);
  };

  // Add this function to create a new conversation
  const createNewConversation = () => {
    // Find the highest existing conversation ID
    const maxId = conversations.reduce(
      (max, conv) => (conv.id > max ? conv.id : max),
      0
    );

    // Create a new conversation with the next ID
    const newConversation = {
      id: maxId + 1,
      title: "New Chat",
      messages: [],
    };

    // Add the new conversation to the list
    setConversations([...conversations, newConversation]);

    // Set the new conversation as the current one
    setCurrentConversationId(newConversation.id);
  };

  return (
    <div className="w-full flex h-screen">
      <div className="w-[20vw] border-r border-r-gray-200 p-4 overflow-y-auto">
        <div className="mb-4">
          <Button
            variant="default"
            className="w-full justify-start mb-4 bg-black h-[5vh] text-white"
            onClick={() => createNewConversation()}
          >
            <span className="mr-2">+</span> Start a new chat
          </Button>
        </div>
        <h2 className="text-lg font-semibold mb-4">Conversations</h2>
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className="flex items-center mb-2 group w-full h-[5vh] space-x-1 cursor-pointer"
          >
            <Button
              variant={
                conv.id === currentConversationId ? "secondary" : "ghost"
              }
              className={`flex-1 justify-start pr-1 overflow-hidden h-full ${
                conv.id === currentConversationId
                  ? "bg-black text-white"
                  : "bg-gray-300"
              }`}
              onClick={() => handleConversationChange(conv.id)}
            >
              <span className="truncate">{conv.title}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hover:bg-red-400 hover:text-white h-full"
              onClick={(e) => deleteConversation(e, conv.id)}
            >
              <span className="sr-only">Delete</span>×
            </Button>
          </div>
        ))}
      </div>

      {/* Right chat interface */}
      <div className="flex-1 flex flex-col w-full">
        <div className="flex items-center justify-between p-4 border-b border-b-gray-200 w-full">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="truncate">{currentConversation.title}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Button>
          </div>
        </div>

        <div className="h-full flex-1 overflow-auto p-4 w-full px-40">
          {isNewChat && conversations.length <= 0 && (
            <div className="h-full w-full flex flex-col justify-center items-center text-center">
              <h2 className="text-4xl font-semibold mb-4">
                Welcome to the MoMo Shield chatbot !{" "}
              </h2>
              <span className="text-gray-500 text-2xl">
                Got a suspicious message ? Ask us about it !
              </span>
            </div>
          )}

          {isNewChat && conversations.length > 0 ? (
            <div className="h-full w-full flex justify-center items-center">
              <InitialChatForm onSubmit={handleInitialSubmit} />
            </div>
          ) : (
            <>
              {currentConversation.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  } mb-4`}
                >
                  <Card
                    className={`p-4 max-w-[80%] min-w-[30%] ${
                      message.role === "user"
                        ? "bg-emerald-100"
                        : "bg-yellow-100"
                    }`}
                  >
                    <div
                      className={`flex gap-4 ${
                        message.role === "user"
                          ? "flex-row-reverse"
                          : "flex-row"
                      }`}
                    >
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center text-white ${
                          message.role === "user"
                            ? "bg-emerald-500"
                            : "bg-yellow-500"
                        }`}
                      >
                        {message.role === "user" ? "You" : "AI"}
                      </div>
                      <div className="flex-1">
                        {message.senderName && message.role === "user" && (
                          <div className="text-sm font-semibold mb-1">You</div>
                        )}

                        {/* Display probability and tags if available */}
                        {message.role === "assistant" &&
                          message.probability !== undefined && (
                            <div className="mb-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold">
                                  Probability:
                                </span>
                                <span className="text-sm">
                                  {message.probability}%
                                </span>
                              </div>
                              {message.description && (
                                <div className="text-sm mb-1">
                                  {message.description}
                                </div>
                              )}
                              {message.tags && message.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {message.tags.map((tag, i) => (
                                    <span
                                      key={i}
                                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                        {/* Render markdown or plain text */}
                        {message.isMarkdown ? (
                          <MarkdownRenderer content={message.content} />
                        ) : (
                          <div>{message.content}</div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              ))}

              {/* Error message */}
              {error && (
                <div className="flex justify-center my-4">
                  <Card className="p-4 bg-red-50 text-red-600">{error}</Card>
                </div>
              )}

              {/* Loading spinner */}
              {isLoading && (
                <div className="flex justify-center my-4">
                  <Card className="p-4 flex items-center gap-2">
                    <Spinner className="h-5 w-5" />
                    <span>Generating response...</span>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>

        {!isNewChat && (
          <div className="p-4 border-t">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
              <div className="flex flex-col gap-2">
                <Input
                  ref={inputRef}
                  className="w-full"
                  placeholder="Type your question here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                />
                <div className="flex justify-between items-center">
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isLoading}
                    >
                      <Image className="h-4 w-4" />
                      <span className="sr-only">Upload image</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                    >
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">Upload document</span>
                    </Button>
                  </div>
                  <Button type="submit" size="icon" disabled={isLoading}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileUpload}
          accept=".txt,.pdf,.doc,.docx"
        />

        <input
          type="file"
          ref={imageInputRef}
          className="hidden"
          onChange={handleImageUpload}
          accept="image/*"
        />

        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Insert Link</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  placeholder="Please enter URL"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsLinkDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleLinkInsert}>
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <SettingsDialog
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
        />
      </div>
    </div>
  );
}
