import ChatClient from "@/components/chat/chat-client";

export default function ChatPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="eyebrow">Chat</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          Live conversation workspace.
        </h1>
        <p className="text-sm text-[rgb(var(--muted))] sm:text-base">
          Draft, correct, and rehearse with immediate feedback. Messages stay on
          device while the tutor responds in real time.
        </p>
      </header>
      <ChatClient />
    </div>
  );
}
