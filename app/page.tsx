"use client";
import { useState, useRef, useEffect } from "react";
import { 
  Send, User, Bot, Menu, Settings, MessageSquare, 
  Database, Activity, CheckCircle2, X, ShieldCheck, Timer,
  Briefcase, Headset, Package, Wallet, Pencil // Tambahan Ikon Pencil
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
        headers: { "Content-Type": "application/json" },
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
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 hidden md:flex z-20 shadow-xl">
        <div className="p-5 flex items-center gap-3 border-b border-slate-800">
          <Database className="text-blue-500" size={24} />
          <h1 className="text-lg font-bold text-white tracking-wide">Nusantara OmniAgent</h1>
        </div>
        <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
          <button onClick={handleNewChat} className="flex items-center gap-3 w-full p-3 bg-blue-600 text-white rounded-lg transition hover:bg-blue-700 shadow-sm">
            <MessageSquare size={18} />
            <span className="text-sm font-medium">New Chat</span>
          </button>
          
          <div className="pt-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Omni-Agents Status</div>
            <div className="space-y-1">
              {Object.keys(activeAgents).map((agent) => (
                <button key={agent} onClick={() => toggleAgent(agent as keyof typeof activeAgents)} className="flex items-center justify-between w-full p-2 hover:bg-slate-800 rounded-md transition">
                  <span className="text-sm flex items-center gap-2 capitalize">
                    {AGENT_ICONS[agent as keyof typeof AGENT_ICONS]} 
                    {agent.replace('_', ' ')}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${activeAgents[agent as keyof typeof activeAgents] ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-600'}`}></div>
                </button>
              ))}
            </div>
          </div>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-3 text-sm hover:text-white transition w-full p-2 rounded-md hover:bg-slate-800">
            <Settings size={18} /> System Settings
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm shrink-0 justify-between">
          <div className="flex items-center gap-3">
            <Menu className="md:hidden text-gray-600 cursor-pointer" size={24} />
            <h2 className="font-semibold text-gray-800">OmniAgent Workspace</h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            Colab Connected
          </div>
        </header>

        {/* CHAT AREA */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                <Bot size={40} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-gray-700">OmniAgent Ready</h2>
              <p className="text-sm text-center max-w-md">Tanyakan tentang stok gudang, pengembalian dana, atau standar operasional prosedur perusahaan.</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8">
              {messages.map((msg, index) => (
                <div key={index} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  
                  {msg.role === "ai" && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shrink-0 shadow-md">
                      <Bot size={20} />
                    </div>
                  )}

                  <div className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} max-w-[85%] group`}>
                    
                    {/* NAMA AGENT */}
                    {msg.role === "ai" && (
                      <span className="text-xs text-gray-500 mb-1.5 ml-1 font-semibold flex items-center gap-1.5 uppercase tracking-wide">
                        <Activity size={12} className="text-blue-500"/> {msg.agent || "OmniAgent"}
                      </span>
                    )}

                    {/* RENDER CHAT / EDIT TEXTAREA */}
                    {editingIndex === index ? (
                       <div className="w-full bg-blue-600 p-4 rounded-2xl rounded-tr-sm shadow-sm flex flex-col gap-3 min-w-[300px] sm:min-w-[400px]">
                         <textarea
                           value={editValue}
                           onChange={(e) => setEditValue(e.target.value)}
                           className="w-full bg-blue-700/50 text-white placeholder-blue-300 border border-blue-500 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                           rows={3}
                           autoFocus
                         />
                         <div className="flex justify-end gap-2">
                           <button onClick={() => setEditingIndex(null)} className="px-4 py-2 text-xs font-semibold text-blue-100 hover:text-white hover:bg-blue-500 rounded-lg transition">Batal</button>
                           <button onClick={() => handleEditSubmit(index)} className="px-4 py-2 text-xs font-semibold bg-white text-blue-700 hover:bg-gray-100 rounded-lg transition shadow-sm">Simpan & Kirim</button>
                         </div>
                       </div>
                    ) : (
                      <div className="relative w-full flex justify-end items-center gap-2">
                        {/* TOMBOL EDIT PENCIL */}
                        {msg.role === "user" && !isLoading && (
                          <button 
                            onClick={() => { setEditingIndex(index); setEditValue(msg.content); }} 
                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all" 
                            title="Edit prompt"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        <div className={`px-6 py-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            msg.role === "user" ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm prose prose-sm max-w-none"
                          }`}>
                          {msg.role === "ai" ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}
                        </div>
                      </div>
                    )}

                    {/* METRICS EVALUATOR UI */}
                    {msg.role === "ai" && msg.metrics && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-[10px] font-semibold border border-blue-100">
                          <Timer size={12} /> {msg.time ? `${msg.time.toFixed(1)}s` : '-'}
                        </div>
                        <div className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md text-[10px] font-semibold border border-purple-100">
                          <ShieldCheck size={12} /> Accuracy: {msg.metrics.accuracy}/10
                        </div>
                        <div className="flex items-center gap-1 bg-rose-50 text-rose-700 px-2.5 py-1 rounded-md text-[10px] font-semibold border border-rose-100">
                          <ShieldCheck size={12} /> No-Hallucination: {msg.metrics.hallucination}/10
                        </div>
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-sm border border-blue-200">
                      <User size={20} />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500 shrink-0 animate-pulse">
                    <Bot size={20} />
                  </div>
                  <div className="flex flex-col items-start w-full max-w-md">
                    <span className="text-xs text-blue-600 mb-2 ml-1 font-semibold flex items-center gap-2">
                      <Activity size={14} className="animate-spin"/> OmniAgent is reasoning...
                    </span>
                    <div className="w-full px-5 py-4 rounded-2xl bg-white border border-gray-200 rounded-tl-sm shadow-sm space-y-3">
                      {WORKFLOW_STEPS.map((step) => (
                        <div key={step.id} className="flex items-center gap-3 text-sm">
                          {activeStep > step.id ? (
                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                          ) : activeStep === step.id ? (
                            <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0"></div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-200 shrink-0"></div>
                          )}
                          <span className={`${activeStep >= step.id ? 'text-gray-800' : 'text-gray-400'}`}>{step.text}</span>
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
        <div className="shrink-0 bg-white border-t border-gray-200 p-4 md:p-6 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.02)] z-10">
          <div className="max-w-4xl mx-auto relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder=" Berikan saya pertanyaan terkait stok gudang, pengembalian dana, atau SOP perusahaan..."
              className="w-full pl-6 pr-14 py-4 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-inner text-gray-700"
              disabled={isLoading}
            />
            <button onClick={handleSend} disabled={isLoading || !input.trim()} className="absolute right-3 p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition shadow-sm">
              <Send size={18} className={isLoading ? "animate-pulse" : ""} />
            </button>
          </div>

          {/* DISCLAIMER TEXT - Posisi Center */}
          <div className="text-center mt-3 text-xs text-gray-400 font-medium">
            OmniAgent dapat membuat kesalahan. Harap selalu periksa kembali informasi penting atau hubungi staf manusia.
          </div>
        </div>
      </main>

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><Settings size={18}/> System Settings</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-red-500 transition"><X size={20} /></button>
            </div>
            <form onSubmit={saveSettings} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Backend API URL (Ngrok)</label>
                <input 
                  type="url" 
                  value={apiUrl} 
                  onChange={(e) => setApiUrl(e.target.value)} 
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="https://xxx.ngrok-free.app/chat" 
                  required 
                />
              </div>
              <button type="submit" className="w-full py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition shadow-md">
                Save Configuration
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}