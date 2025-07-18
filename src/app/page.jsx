"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { FaPaperPlane, FaUser } from "react-icons/fa6";

import Loader from "@/components/Loader";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const textareaRef = useRef(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () =>
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(scrollToBottom, [messages]);

  // Send a message using /api/chat
  const sendMessage = async () => {
    if (!input.trim() || busy) return;

    // Reset input height
    textareaRef.current.style.height = "auto";

    const base = [...messages, { role: "user", text: input }];
    const botIndex = base.length;

    // Create new blank message
    setMessages([...base, { role: "model", text: "", loading: true }]);
    setInput("");
    setBusy(true);

    // Stream the message from the api
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: base.map((m) => ({
            role: m.role,
            parts: [{ text: m.text }],
          })),
        }),
      });

      if (!res.body) throw new Error("No stream from /api/chat");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Update the single bot bubble
        setMessages((prev) => {
          const next = [...prev];
          next[botIndex] = { role: "model", text: buffer, loading: true };
          return next;
        });
      }

      // Finalise bubble
      setMessages((prev) => {
        const next = [...prev];
        next[botIndex] = { role: "model", text: buffer, loading: false };
        return next;
      });
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "Failed to load response.", loading: false },
      ]);
    }

    setBusy(false);
  };

  // Render everything
  return (
    <main className="mx-auto max-w-4xl p-8">
      {/* Message list */}
      <div className="space-y-3 pb-32">
        {messages.map((msg, i) => (
          <ChatMessage key={i} msg={msg} />
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* UVA logo*/}
      <Image
        src="/uva_icon.png"
        alt="avatar"
        width={256}
        height={256}
        className={cn(
          "size-24 absolute top-[calc(50%-96px-2rem)] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none opacity-0",
          "transition-opacity duration-100 ease-out",
          messages.length === 0 && "opacity-100",
        )}
      />

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className={cn(
          "fixed flex inset-x-0 left-1/2 -translate-x-1/2 w-full mx-auto max-w-4xl gap-2 bg-bg rounded-xl border border-border p-2",
          "shadow-[0_12px_24px_rgba(0,0,0,.05)]",
          "transition-all duration-100 ease-in-out",
          messages.length === 0 ? "top-1/2" : "bottom-8",
        )}
      >
        <textarea
          ref={textareaRef}
          className="flex-1 max-h-[14rem] overflow-y-auto resize-none rounded px-3 py-2 outline-none ring-0 border-none scrollbar-thin scrollbar-thumb-bg-3"
          placeholder="Type your message..."
          rows={1}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (textareaRef.current) {
              textareaRef.current.style.height = "auto"; // reset height
              textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // set to scroll height
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <div
          className={cn(
            "flex transititon-all duration-100 ease-in-out",
            messages.length === 0 ? "items-start" : "items-end",
          )}
        >
          <button
            type="submit"
            disabled={busy}
            className={cn(
              "h-10 w-10 min-w-[2.5rem] flex items-center justify-center rounded-lg bg-orange text-white",
              busy && "bg-orange/40",
            )}
          >
            <FaPaperPlane className="size-4" />
          </button>
        </div>
      </form>
    </main>
  );
}

// ---------- Helpers ---------- //

function ChatMessage({ msg }) {
  const isUser = msg.role === "user";

  return (
    <div className={cn("flex items-start gap-2", isUser ? "justify-end" : "")}>
      {!isUser && (
        <Image
          src="/uva_icon.png"
          alt="avatar"
          width={24}
          height={24}
          className="size-8 mt-1 pointer-events-none select-none animate-fade-in"
        />
      )}
      <Bubble isUser={isUser} msg={msg} />
      {isUser && (
        <FaUser className="text-white bg-bg-2 p-2 size-9 rounded-full pointer-events-none animate-fade-in-up" />
      )}
    </div>
  );
}

function Bubble({ isUser, msg }) {
  return (
    <div
      className={cn(
        "max-w-full rounded-md px-3 py-1 prose prose-sm leading-loose",
        isUser
          ? "bg-bg-alt text-white animate-fade-in-up"
          : "bg-bg animate-fade-in",
      )}
    >
      {isUser ? (
        <div className="whitespace-pre-line">{msg.text}</div>
      ) : (
        <>
          {msg.text && <ReactMarkdown>{msg.text}</ReactMarkdown>}
          {!msg.text && (
            <>
              <Loader />
              <DelayedNotice />
            </>
          )}
        </>
      )}
    </div>
  );
}

// Delayed message (for when the response takes a long time)
function DelayedNotice({ delay = 5000 }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(id);
  }, [delay]);

  return show ? (
    <p className="mt-2 text-xs text-bg-3 animate-fade-in">
      Due to many requests, the chatbot might take a second...
    </p>
  ) : null;
}
