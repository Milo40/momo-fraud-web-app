"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface InitialChatFormProps {
  onSubmit: (senderName: string, message: string) => void;
}

export function InitialChatForm({ onSubmit }: InitialChatFormProps) {
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({ senderName: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const newErrors = {
      senderName: senderName.trim() === "" ? "Sender name is required" : "",
      message: message.trim() === "" ? "Message content is required" : "",
    };

    setErrors(newErrors);

    // If no errors, submit the form
    if (!newErrors.senderName && !newErrors.message) {
      onSubmit(senderName, message);
    }
  };

  return (
    <Card className="p-6 min-w-lg max-w-lg mx-auto border-0 shadow-none">
      <h2 className="text-xl font-semibold mb-4">Start a new conversation</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="senderName">Who sent the message ?</Label>
          <Input
            id="senderName"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="Sender here"
          />
          {errors.senderName && (
            <p className="text-sm text-red-500">{errors.senderName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What's the content ?"
            rows={10}
          />
          {errors.message && (
            <p className="text-sm text-red-500">{errors.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full bg-black text-white">
          Start Conversation
        </Button>
      </form>
    </Card>
  );
}
