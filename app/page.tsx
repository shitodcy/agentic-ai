"use client";
import { useState, useRef, useEffect } from "react";
import { 
  Send, User, Bot, Menu, Settings, MessageSquare, 
  Database, Activity, CheckCircle2, X, ShieldCheck, Timer,
  Briefcase, Headset, Package, Wallet, Pencil, ChevronRight,
  Zap, Cpu, GitBranch, Sparkles
} from "lucide-react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "ai";
  content: string;
  agent?: string;
  time?: number;
  metrics?: {
    accuracy: number;
    effectiveness: number;
    explainability: number;
    hallucination: number;
  };
};

const WORKFLOW_STEPS = [
  { id: 1, text: "Supervisor Agent: Analyzing User Intent..." },
  { id: 2, text: "Routing: Delegating to Specialist Agent..." },
  { id: 3, text: "Execution: Querying Database / RAG Tool..." },
  { id: 4, text: "Synthesizing: Sanitizing Output..." }
];

const AGENT_ICONS = {
  supervisor: <Briefcase size={16} className="text-blue-400" />,
  customer_service: <Headset size={16} className="text-emerald-400" />,
  inventory: <Package size={16} className="text-amber-400" />,
  finance: <Wallet size={16} className="text-rose-400" />
};

export default function EnterpriseAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  
  // STATE EDITING
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const [activeAgents, setActiveAgents] = useState({ 
    supervisor: true, 
    customer_service: true,
    inventory: true, 
    finance: true 
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, activeStep, editingIndex]);

  const handleNewChat = () => {
    if (confirm("Mulai percakapan baru? Riwayat chat saat ini akan dihapus.")) {
      setMessages([]);
      setEditingIndex(null);
    }
  };

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingsOpen(false);
    alert("Konfigurasi API berhasil disimpan!");
  };

  const toggleAgent = (agent: keyof typeof activeAgents) => {
    setActiveAgents(prev => ({ ...prev, [agent]: !prev[agent] }));
  };

  // REFACTOR: Fungsi untuk mengirim pesan (Bisa dari Input baru atau Edit)
  const submitMessage = async (textToSubmit: string, currentHistory: Message[]) => {
    if (!textToSubmit.trim()) return;

    const userMessage: Message = { role: "user", content: textToSubmit };
    setMessages([...currentHistory, userMessage]);
    setInput("");
    setIsLoading(true);
    setActiveStep(1);

    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 1200);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json",
                   "ngrok-skip-browser-warning": "true"},
        body: JSON.stringify({
          message: textToSubmit,
          session_id: "demo-session-local",
        }),
      });

      const data = await response.json();
      clearInterval(stepInterval);
      setActiveStep(4);

      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          { 
            role: "ai", 
            content: data.answer, 
            agent: data.agent,
            time: data.time,
            metrics: {
              accuracy: data.accuracy || 0,
              effectiveness: data.effectiveness || 0,
              explainability: data.explainability || 0,
              hallucination: data.hallucination || 0
            }
          },
        ]);
      } else {
        throw new Error(data.detail || "Gagal menghubungi server");
      }
    } catch (error) {
      clearInterval(stepInterval);
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: `**Error:** Koneksi ke AI Engine terputus. Pastikan URL Ngrok valid.`, agent: "System Error" },
      ]);
    } finally {
      setIsLoading(false);
      setActiveStep(0);
    }
  };

  const handleSend = () => {
    submitMessage(input, messages);
  };

  const handleEditSubmit = (index: number) => {
    if (!editValue.trim()) return;
    // Potong chat history sampai sebelum index pesan yang diedit
    const historyUpToIndex = messages.slice(0, index);
    setEditingIndex(null);
    submitMessage(editValue, historyUpToIndex);
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-surface flex flex-col flex-shrink-0 hidden md:flex z-20 border-r border-border">
        <div className="p-6 flex items-center gap-3 border-b border-border">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Cpu size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">OmniAgent</h1>
            <p className="text-xs text-foreground/60">v1.0</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button onClick={handleNewChat} className="flex items-center gap-3 w-full p-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all duration-200 group">
            <MessageSquare size={18} />
            <span className="text-sm font-medium">New Chat</span>
            <ChevronRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
          </button>
          
          <div className="pt-4">
            <div className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-3 px-2">Agents Status</div>
            <div className="space-y-1.5">
              {Object.keys(activeAgents).map((agent) => (
                <button key={agent} onClick={() => toggleAgent(agent as keyof typeof activeAgents)} className="flex items-center justify-between w-full p-2.5 hover:bg-surface-light rounded-lg transition-all duration-200 group">
                  <span className="text-sm flex items-center gap-2 capitalize text-foreground/80 group-hover:text-foreground">
                    {AGENT_ICONS[agent as keyof typeof AGENT_ICONS]} 
                    {agent.replace('_', ' ')}
                  </span>
                  <div className={`w-2 h-2 rounded-full transition-all ${activeAgents[agent as keyof typeof activeAgents] ? 'bg-accent animate-pulse' : 'bg-border'}`}></div>
                </button>
              ))}
            </div>
          </div>
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-3 text-sm w-full p-2.5 rounded-lg hover:bg-surface-light transition-all duration-200">
            <Settings size={18} className="text-primary" /> 
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 bg-background relative">
        {/* HEADER */}
        <header className="h-16 bg-surface/50 border-b border-border flex items-center px-6 shrink-0 justify-between backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Menu className="md:hidden text-foreground cursor-pointer hover:text-primary transition" size={24} />
            <h2 className="font-semibold text-foreground">Workspace</h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium badge bg-accent/10 text-accent border-accent/30">
            <Zap size={14} />
            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
            Active
          </div>
        </header>

        {/* CHAT AREA */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-fade-in space-y-6 text-center max-w-md">
                <div className="w-24 h-24 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 backdrop-blur-sm">
                  <Sparkles size={48} className="text-primary animate-pulse-slow" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Start your conversation</h2>
                  <p className="text-sm text-foreground/60 leading-relaxed">Ask about warehouse inventory, refunds, or company SOPs. Our AI agents are ready to help.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((msg, index) => (
                <div key={index} className={`flex gap-4 animate-slide-in-up ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  
                  {msg.role === "ai" && (
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0 border border-primary/30">
                      <Bot size={20} />
                    </div>
                  )}

                  <div className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} max-w-[85%] group`}>
                    
                    {/* AGENT NAME */}
                    {msg.role === "ai" && (
                      <span className="text-xs text-foreground/50 mb-2 ml-1 font-semibold flex items-center gap-1.5 uppercase tracking-wide">
                        <Zap size={12} className="text-accent"/> {msg.agent || "OmniAgent"}
                      </span>
                    )}

                    {/* MESSAGE CONTENT / EDIT */}
                    {editingIndex === index ? (
                       <div className="w-full bg-primary/10 p-4 rounded-2xl rounded-tr-sm border border-primary/30 flex flex-col gap-3 min-w-[300px] sm:min-w-[400px] backdrop-blur-sm">
                         <textarea
                           value={editValue}
                           onChange={(e) => setEditValue(e.target.value)}
                           className="w-full bg-surface text-foreground border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none placeholder-foreground/40"
                           rows={3}
                           autoFocus
                         />
                         <div className="flex justify-end gap-2">
                           <button onClick={() => setEditingIndex(null)} className="btn-ghost text-xs">Cancel</button>
                           <button onClick={() => handleEditSubmit(index)} className="btn-primary text-xs">Save & Send</button>
                         </div>
                       </div>
                    ) : (
                      <div className="relative w-full flex justify-end items-center gap-2">
                        {msg.role === "user" && !isLoading && (
                          <button 
                            onClick={() => { setEditingIndex(index); setEditValue(msg.content); }} 
                            className="opacity-0 group-hover:opacity-100 p-2 text-foreground/40 hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200" 
                            title="Edit message"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        <div className={`px-6 py-4 rounded-2xl text-sm leading-relaxed backdrop-blur-sm border transition-all duration-200 ${
                            msg.role === "user" 
                              ? "bg-primary/20 text-foreground border-primary/40 rounded-tr-sm shadow-lg shadow-primary/10" 
                              : "bg-surface/50 border-border text-foreground rounded-tl-sm hover:border-primary/50 prose prose-sm prose-invert max-w-none"
                          }`}>
                          {msg.role === "ai" ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}
                        </div>
                      </div>
                    )}

                    {/* METRICS */}
                    {msg.role === "ai" && msg.metrics && (
                      <div className="mt-3 flex flex-wrap gap-2 animate-fade-in">
                        <div className="flex items-center gap-1.5 badge bg-primary/10 text-primary border-primary/30">
                          <Timer size={12} /> {msg.time ? `${msg.time.toFixed(1)}s` : '-'}
                        </div>
                        <div className="flex items-center gap-1.5 badge bg-accent/10 text-accent border-accent/30">
                          <ShieldCheck size={12} /> {msg.metrics.accuracy}/10
                        </div>
                        <div className="flex items-center gap-1.5 badge bg-foreground/10 text-foreground/80 border-border">
                          <Activity size={12} /> {(10 - msg.metrics.hallucination)}/10
                        </div>
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/30">
                      <User size={20} />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4 justify-start animate-slide-in-up">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0 border border-primary/30 animate-pulse">
                    <Bot size={20} />
                  </div>
                  <div className="flex flex-col items-start w-full max-w-md">
                    <span className="text-xs text-primary mb-2 ml-1 font-semibold flex items-center gap-2 uppercase tracking-wide">
                      <GitBranch size={14} className="animate-spin"/> Processing...
                    </span>
                    <div className="w-full px-5 py-4 rounded-2xl bg-surface/50 border border-border rounded-tl-sm backdrop-blur-sm space-y-3">
                      {WORKFLOW_STEPS.map((step) => (
                        <div key={step.id} className="flex items-center gap-3 text-sm">
                          {activeStep > step.id ? (
                            <CheckCircle2 size={16} className="text-accent shrink-0 animate-slide-in-down" />
                          ) : activeStep === step.id ? (
                            <div className="w-4 h-4 rounded-full border-2 border-primary/50 border-t-primary animate-spin shrink-0"></div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-border shrink-0"></div>
                          )}
                          <span className={`transition-colors ${activeStep >= step.id ? 'text-foreground' : 'text-foreground/50'}`}>{step.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* INPUT AREA */}
        <div className="shrink-0 bg-surface/50 border-t border-border p-4 md:p-6 backdrop-blur-md z-10">
          <div className="max-w-4xl mx-auto relative flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Ask me anything..."
                className="w-full pl-4 pr-12 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground placeholder-foreground/40"
                disabled={isLoading}
              />
              <button 
                type="button" 
                onClick={handleSend} 
                disabled={isLoading || !input.trim()} 
                className="absolute right-2 p-2 bg-primary hover:brightness-110 disabled:opacity-50 text-white rounded-lg transition-all duration-200 hover:shadow-lg disabled:shadow-none"
                style={!isLoading && input.trim() ? { boxShadow: '0 0 12px rgba(91, 124, 250, 0.4)' } : {}}
              >
                <Send size={18} className={isLoading ? "animate-pulse" : ""} />
              </button>
            </div>
          </div>

          <div className="text-center mt-3 text-xs text-foreground/50 font-medium">
            AI responses may contain errors. Always verify important information.
          </div>
        </div>
      </main>

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card w-full max-w-md overflow-hidden shadow-2xl border-border/50 animate-slide-in-down">
            <div className="flex justify-between items-center p-6 border-b border-border bg-surface/50">
              <h3 className="font-bold text-foreground flex items-center gap-2"><Settings size={18} className="text-primary"/> System Settings</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-foreground/50 hover:text-foreground transition-colors p-1 hover:bg-surface rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={saveSettings} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Backend API URL</label>
                <input 
                  type="url" 
                  value={apiUrl} 
                  onChange={(e) => setApiUrl(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-border bg-surface/50 text-foreground rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-foreground/40" 
                  placeholder="https://xxx.ngrok-free.app/chat" 
                  required 
                />
              </div>
              <button type="submit" className="btn-primary w-full">Save Configuration</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
