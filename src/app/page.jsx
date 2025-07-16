"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import Loader from "@/components/Loader"; // bouncing dots, etc.

export default function ChatPage() {
  /** ----------------  state  ---------------- */
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const chatEndRef = useRef(null);

  /** ----------------  helpers  ---------------- */
  const scrollToBottom = () =>
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(scrollToBottom, [messages]);

  /** ----------------  sendMessage ------------- */
  const sendMessage = async () => {
    if (!input.trim() || busy) return;

    const base = [...messages, { role: "user", text: input }];
    const botIndex = base.length;

    // add user msg + blank bot bubble
    setMessages([...base, { role: "model", text: "", loading: true }]);
    setInput("");
    setBusy(true);

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

      if (!res.body)
        throw new Error(
          "No stream from /api/chat (did you set runtime = 'edge'?)",
        );

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // update the single bot bubble
        setMessages((prev) => {
          const next = [...prev];
          next[botIndex] = { role: "model", text: buffer, loading: true };
          return next;
        });
      }

      // finalise bubble
      setMessages((prev) => {
        const next = [...prev];
        next[botIndex] = { role: "model", text: buffer, loading: false };
        return next;
      });
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "❌ Failed to load response.", loading: false },
      ]);
    }

    setBusy(false);
  };

  /** ----------------  render  ---------------- */
  return (
    <main className="mx-auto max-w-4xl p-4">
      {/* message list */}
      <div className="space-y-3 pb-24">
        {messages.map((msg, i) => (
          <ChatMessage key={i} msg={msg} />
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="fixed inset-x-0 bottom-4 mx-auto flex max-w-4xl gap-2 rounded-md bg-bg-3 p-2 text-white"
      >
        <input
          className="flex-1 rounded px-3 py-2 text-black"
          placeholder="Type your message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-orange px-4 py-2"
        >
          {busy ? "…" : "Send"}
        </button>
      </form>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*                        helper components                            */
/* ------------------------------------------------------------------ */

function ChatMessage({ msg }) {
  const isUser = msg.role === "user";
  const avatar = isUser ? "/user_icon.png" : "/uva_icon.png";

  return (
    <div className={`flex items-start gap-2 ${isUser ? "justify-end" : ""}`}>
      {!isUser && <Avatar src={avatar} />}
      <Bubble isUser={isUser} msg={msg} />
      {isUser && <Avatar src={avatar} />}
    </div>
  );
}

function Avatar({ src }) {
  return (
    <Image
      src={src}
      alt="avatar"
      width={24}
      height={24}
      className="size-8 mt-1"
    />
  );
}

function Bubble({ isUser, msg }) {
  return (
    <div
      className={`
        max-w-full rounded-md px-3 py-2 prose prose-sm dark:prose-invert
        ${isUser ? "bg-bg-3 text-white" : "bg-bg"}
      `}
    >
      {isUser ? (
        msg.text
      ) : (
        <>
          {msg.text && <ReactMarkdown>{msg.text}</ReactMarkdown>}
          {msg.loading && (
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

/* -------  delayed “busy” notice  ------- */
function DelayedNotice({ delay = 5000 }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(id);
  }, [delay]);

  return show ? (
    <p className="mt-2 text-xs text-gray-500 animate-fade-in">
      Due to many requests, the chatbot might take a second…
    </p>
  ) : null;
}
