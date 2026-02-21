import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, Search, User } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface Message {
  _id: string;
  sender: string;
  receiver: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface Conversation {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  last_message: string;
  last_time: string;
  unread: number;
}

const Messages = () => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [convLoading, setConvLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const response = await api.get('/messages/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setConvLoading(false);
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/messages/messages/${otherUserId}`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.user_id);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket listener
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('join', user._id);

    const handleReceiveMessage = (msg: Message) => {
      if (selectedUser && (msg.sender === selectedUser.user_id || msg.receiver === selectedUser.user_id)) {
        setMessages((prev) => [...prev, msg]);
      }
      fetchConversations();
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket, user, selectedUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedUser) return;

    try {
      const response = await api.post("/messages/messages", {
        receiverId: selectedUser.user_id,
        content: newMessage.trim(),
      });

      const sentMsg = response.data;
      setMessages((prev) => [...prev, sentMsg]);
      setNewMessage("");

      if (socket) {
        socket.emit('send_message', {
          ...sentMsg,
          receiverId: selectedUser.user_id
        });
      }

      fetchConversations();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const isOnline = (userId: string) => onlineUsers.includes(userId);

  if (selectedUser) {
    return (
      <div className="py-6 flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-2rem)]">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="relative">
            <Avatar className="h-10 w-10 border border-primary/20">
              <AvatarImage src={selectedUser.avatar_url?.startsWith('http') ? selectedUser.avatar_url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${selectedUser.avatar_url}`} />
              <AvatarFallback className="gradient-primary text-primary-foreground">
                {selectedUser.display_name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            {isOnline(selectedUser.user_id) && (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{selectedUser.display_name}</h3>
            <p className="text-[10px] text-muted-foreground">@{selectedUser.username}</p>
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-2">
            {messages.map((msg) => (
              <motion.div
                key={msg._id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.sender === user?._id ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${msg.sender === user?._id
                    ? "gradient-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                    }`}
                >
                  <p>{msg.content}</p>
                  <p className={`text-[9px] mt-1 ${msg.sender === user?._id ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <form onSubmit={handleSendMessage} className="flex gap-2 mt-4">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={!newMessage.trim() || loading} className="gradient-primary text-primary-foreground">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-4">
      <h1 className="text-2xl font-bold font-display">Messages</h1>

      {convLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16 glass rounded-2xl border-dashed">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Send className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">No conversations yet</p>
          <Button variant="link" className="text-primary mt-2">Start a conversation from a profile</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <button
              key={conv.user_id}
              onClick={() => setSelectedUser(conv)}
              className="w-full glass rounded-xl p-3 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors group"
            >
              <div className="relative shrink-0">
                <Avatar className="h-12 w-12 border border-primary/10 transition-transform group-hover:scale-105">
                  <AvatarImage src={conv.avatar_url?.startsWith('http') ? conv.avatar_url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${conv.avatar_url}`} />
                  <AvatarFallback className="gradient-primary text-primary-foreground">
                    {conv.display_name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {isOnline(conv.user_id) && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-sm truncate">{conv.display_name || "User"}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(conv.last_time), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground truncate flex-1">{conv.last_message}</p>
                  {conv.unread > 0 && (
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
                  )}
                </div>
              </div>
              {conv.unread > 0 && (
                <span className="h-5 min-w-5 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground px-1.5 ml-2">
                  {conv.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Messages;
