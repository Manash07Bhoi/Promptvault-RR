import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuthStore } from "@/store/use-auth-store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { MessageSquare, Send, ArrowLeft, CheckCheck, Search, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

function ConversationList({
  conversations, activeId, onSelect, isLoading
}: {
  conversations: any[];
  activeId?: number;
  onSelect: (c: any) => void;
  isLoading: boolean;
}) {
  const [search, setSearch] = useState("");
  const filtered = conversations.filter(c =>
    c.other?.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    c.other?.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full border-r border-border">
      <div className="p-4 border-b border-border">
        <h2 className="font-display font-bold text-foreground text-lg mb-3">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="pl-9 h-8 text-sm"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p>No conversations yet</p>
            <p className="text-xs mt-1">Visit a creator profile to start messaging</p>
          </div>
        ) : (
          filtered.map(c => (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className={cn(
                "w-full flex items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0",
                activeId === c.id && "bg-primary/5 border-r-2 border-r-primary"
              )}
            >
              <div className="relative flex-shrink-0">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={c.other?.avatarUrl} />
                  <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                    {c.other?.displayName?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                {c.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {c.unreadCount > 9 ? "9+" : c.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm font-semibold text-foreground truncate", c.unreadCount > 0 && "font-bold")}>
                    {c.other?.displayName || "Unknown"}
                  </span>
                  {c.lastMessageAt && (
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {formatDistanceToNow(new Date(c.lastMessageAt), { addSuffix: false })}
                    </span>
                  )}
                </div>
                {c.other?.username && (
                  <p className="text-xs text-muted-foreground">@{c.other.username}</p>
                )}
                {c.lastMessage && (
                  <p className={cn("text-xs mt-0.5 truncate", c.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>
                    {c.lastMessage.isFromMe && "You: "}{c.lastMessage.body}
                  </p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
      <div className="p-3 border-t border-border bg-muted/30">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Users className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>Message creators whose packs you've purchased, or buyers of your packs.</p>
        </div>
      </div>
    </div>
  );
}

function MessageThread({ conversation, onBack }: { conversation: any; onBack: () => void }) {
  const { accessToken, user } = useAuthStore();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [body, setBody] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["conversation-messages", conversation.id],
    queryFn: async () => {
      const res = await fetch(`/api/messages/conversations/${conversation.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.json();
    },
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: async (msgBody: string) => {
      const res = await fetch(`/api/messages/conversations/${conversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ body: msgBody }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["conversation-messages", conversation.id] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
  }, [data]);

  const handleSend = useCallback(() => {
    const trimmed = body.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  }, [body, sendMutation]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const messages = data?.messages || [];
  const other = data?.conversation?.other || conversation.other;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack} className="lg:hidden">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Link href={other?.username ? `/u/${other.username}` : "#"}>
          <Avatar className="w-9 h-9 cursor-pointer hover:opacity-80 transition-opacity">
            <AvatarImage src={other?.avatarUrl} />
            <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
              {other?.displayName?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <Link href={other?.username ? `/u/${other.username}` : "#"}>
            <p className="font-semibold text-foreground text-sm hover:text-primary transition-colors cursor-pointer">
              {other?.displayName || "Unknown"}
              {other?.isVerified && <span className="ml-1 text-blue-500 text-xs">✓</span>}
            </p>
          </Link>
          {other?.username && <p className="text-xs text-muted-foreground">@{other.username}</p>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <Skeleton key={i} className={cn("h-12 rounded-xl w-64", i % 2 === 0 && "ml-auto")} />)}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg: any) => (
            <div key={msg.id} className={cn("flex", msg.isFromMe ? "justify-end" : "justify-start")}>
              {!msg.isFromMe && (
                <Avatar className="w-7 h-7 mr-2 flex-shrink-0 mt-1">
                  <AvatarImage src={other?.avatarUrl} />
                  <AvatarFallback className="text-xs">{other?.displayName?.[0]}</AvatarFallback>
                </Avatar>
              )}
              <div className={cn(
                "max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                msg.isFromMe
                  ? "bg-primary text-white rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              )}>
                <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                <div className={cn("flex items-center gap-1 mt-1 text-xs", msg.isFromMe ? "text-white/60 justify-end" : "text-muted-foreground")}>
                  <span>{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}</span>
                  {msg.isFromMe && msg.isRead && <CheckCheck className="w-3 h-3" />}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex gap-2 items-end">
          <Textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Ctrl+Enter to send)"
            className="min-h-[44px] max-h-32 resize-none text-sm"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!body.trim() || sendMutation.isPending}
            size="icon"
            className="flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 text-right">{body.length}/2000</p>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { isAuthenticated, accessToken } = useAuthStore();
  const [activeConversation, setActiveConversation] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["conversations"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await fetch("/api/messages/conversations", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.json();
    },
    refetchInterval: 15000,
  });

  const conversations = data?.conversations || [];

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-140px)] min-h-[500px] rounded-xl border border-border overflow-hidden bg-card flex">
        <div className={cn(
          "w-80 flex-shrink-0 flex flex-col",
          activeConversation ? "hidden lg:flex" : "flex w-full lg:w-80"
        )}>
          <ConversationList
            conversations={conversations}
            activeId={activeConversation?.id}
            onSelect={setActiveConversation}
            isLoading={isLoading}
          />
        </div>

        {activeConversation ? (
          <div className="flex-1 flex flex-col min-w-0">
            <MessageThread conversation={activeConversation} onBack={() => setActiveConversation(null)} />
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center text-muted-foreground flex-col gap-3">
            <MessageSquare className="w-16 h-16 opacity-10" />
            <p className="font-semibold text-foreground">Select a conversation</p>
            <p className="text-sm max-w-xs text-center">Choose a conversation from the left, or visit a creator's profile to start a new one.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
