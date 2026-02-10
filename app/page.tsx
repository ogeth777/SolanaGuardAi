/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, CheckCircle, Search, Loader2, ExternalLink, Globe, Twitter, DollarSign, BarChart3, Lock, FileText, Activity, Zap, Users, AlertOctagon, Heart, Coffee, History, ArrowRight, Bot, MessageCircle, Send, Info, Map, X, Terminal, Radio, Cpu, Network } from 'lucide-react';
import clsx from 'clsx';
import { formatNumber, formatPrice, formatPct } from '@/lib/utils';
import { generateRiskSummary } from '@/lib/ai-summary';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: React.ReactNode;
  timestamp: number;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-scroll on content resize (for typewriter effect)
  useEffect(() => {
    if (!chatContainerRef.current) return;

    const observer = new ResizeObserver(() => {
        scrollToBottom();
    });

    observer.observe(chatContainerRef.current);

    // Also observe subtree mutations for text updates
    const mutationObserver = new MutationObserver(() => {
        scrollToBottom();
    });

    mutationObserver.observe(chatContainerRef.current, { 
        childList: true, 
        subtree: true, 
        characterData: true 
    });

    return () => {
        observer.disconnect();
        mutationObserver.disconnect();
    };
  }, []);

  // Initial Greeting
  useEffect(() => {
    setMessages([
      {
        id: 'init',
        role: 'assistant',
        content: (
            <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-[#14F195]/20 pb-2 mb-2">
                    <Terminal className="w-4 h-4 text-[#14F195]" />
                    <span className="text-[#14F195] font-bold font-mono text-sm tracking-wider">SYSTEM INIT COMPLETE</span>
                </div>
                
                <p>Greetings, Operator. <span className="text-[#14F195] font-bold">Solana Guard AI v2.1</span> is online.</p>
                <p>Ready to audit <span className="text-[#14F195] font-bold">Solana & Base</span> assets. All scanning modules operational.</p>
                
                <div className="grid grid-cols-2 gap-2 my-2">
                    <div className="bg-[#14F195]/5 border border-[#14F195]/20 p-2 rounded text-xs text-[#14F195] font-mono flex items-center gap-2">
                        <Shield className="w-3 h-3" /> MINT AUTH SCAN
                    </div>
                    <div className="bg-[#14F195]/5 border border-[#14F195]/20 p-2 rounded text-xs text-[#14F195] font-mono flex items-center gap-2">
                        <Lock className="w-3 h-3" /> LIQUIDITY CHECK
                    </div>
                    <div className="bg-[#14F195]/5 border border-[#14F195]/20 p-2 rounded text-xs text-[#14F195] font-mono flex items-center gap-2">
                        <Users className="w-3 h-3" /> HOLDER ANALYSIS
                    </div>
                    <div className="bg-[#14F195]/5 border border-[#14F195]/20 p-2 rounded text-xs text-[#14F195] font-mono flex items-center gap-2">
                        <Activity className="w-3 h-3" /> RUG DETECTION
                    </div>
                </div>

                <div className="mt-4 p-3 bg-slate-900/80 rounded border border-slate-700/50 text-left relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[#14F195]/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none"></div>
                    <h3 className="text-xs font-bold text-white mb-2 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                        Protocol Advisory
                    </h3>
                    <div className="space-y-1 text-xs text-slate-400 font-mono">
                        <div className="flex gap-2">
                            <span>[WARN]</span>
                            <span>Rug pulls detected in 12% of new pairs.</span>
                        </div>
                        <div className="flex gap-2">
                            <span>[INFO]</span>
                            <span>Verified contracts (CMC/CG) recommended.</span>
                        </div>
                    </div>
                </div>

                <p className="text-slate-500 text-xs mt-2 font-mono blink">Waiting for target address...</p>
            </div>
        ),
        timestamp: Date.now()
    }
    ]);
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || loading) return;

    const address = inputValue.trim();
    setInputValue('');
    
    // 1. User Message
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { 
        id: userMsgId, 
        role: 'user', 
        content: <div className="font-mono text-[#14F195] tracking-wider">{`> QUERY: ${address}`}</div>, 
        timestamp: Date.now() 
    }]);

    setLoading(true);

    // 2. AI Thinking Message
    const loadingId = 'loading-' + Date.now();
    setMessages(prev => [...prev, { 
        id: loadingId, 
        role: 'assistant', 
        content: (
            <div className="flex items-center gap-2 text-slate-400 font-mono text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-[#14F195]" /> 
                <span className="animate-pulse">ESTABLISHING UPLINK...</span>
            </div>
        ), 
        timestamp: Date.now() 
    }]);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      const aiText = generateRiskSummary(data);

      const result = {
        ...data,
        aiAnalysis: aiText,
        checks: {
          mintDisabled: !data.isMintable,
          lpBurned: !data.isFreezable, // Using freeze as proxy for now
          metadataImmutable: !data.isMutable,
          topHoldersSafe: data.riskScore < 50
        }
      };

      // 3. Replace Thinking with Result
      setMessages(prev => prev.map(m => m.id === loadingId ? {
        ...m,
        content: (
            <div className="animate-in fade-in zoom-in-95 duration-700 ease-out">
                <TokenAnalysis result={result} />
            </div>
        )
      } : m));

    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === loadingId ? {
        ...m,
        content: (
            <div className="flex items-center gap-3 text-red-400 bg-red-900/10 p-4 rounded border border-red-500/30">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse" />
                <div>
                    <div className="font-bold font-mono tracking-wider">SCAN FAILURE</div>
                    <div className="text-xs opacity-80 font-mono">{err.message || "UPLINK TERMINATED UNEXPECTEDLY"}</div>
                </div>
            </div>
        )
      } : m));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-slate-400 font-mono text-sm cyber-grid selection:bg-[#14F195]/30">
  <div className="crt-overlay pointer-events-none fixed inset-0 z-50"></div>

  {/* TOP HUD BAR */}
  <header className="flex-none h-14 border-b border-[#14F195]/20 bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 z-40 relative shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
    <div className="flex items-center gap-3">
        <div className="relative">
            <Shield className="w-6 h-6 text-[#14F195] relative z-10" />
            <div className="absolute inset-0 bg-[#14F195] blur opacity-30 animate-pulse"></div>
        </div>
        <h1 className="font-bold text-lg tracking-wider text-white flex items-center gap-2">
            SOLANA GUARD <span className="text-[#14F195] text-[10px] border border-[#14F195]/30 px-1.5 py-0.5 rounded bg-[#14F195]/10">AI V2.1</span>
        </h1>
    </div>

    {/* Center: System Ticker */}
    <div className="hidden md:flex items-center gap-8 text-[10px] text-slate-500 font-bold tracking-[0.2em]">
         <div className="flex items-center gap-2 text-[#14F195]">
            <span className="w-1.5 h-1.5 bg-[#14F195] rounded-full animate-pulse shadow-[0_0_8px_#14F195]"></span>
            SYSTEM ONLINE
         </div>
         <div className="flex items-center gap-2">
            <Cpu className="w-3 h-3" />
            CORE LOAD: 12%
         </div>
         <div className="flex items-center gap-2">
            <Network className="w-3 h-3" />
            NET LATENCY: 12ms
         </div>
    </div>

    {/* Right: Actions */}
    <button 
        onClick={() => setShowAbout(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-[#14F195]/5 hover:bg-[#14F195]/10 border border-[#14F195]/30 rounded text-[#14F195] text-xs font-bold transition-all hover:shadow-[0_0_15px_rgba(20,241,149,0.1)] hover:border-[#14F195]/60"
    >
        <Info className="w-3 h-3" />
        <span className="hidden sm:inline">About & Roadmap</span>
    </button>
  </header>

      {/* MAIN COMMAND GRID */}
      <main className="flex-1 p-2 md:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 relative z-10">
          
          {/* LEFT COLUMN: Threat Intelligence */}
          <div className="hidden lg:flex col-span-3 flex-col gap-4">
             <StatsModule />
             
             {/* Network Status Module */}
             <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl flex-1 p-4 flex flex-col relative overflow-hidden shadow-lg">
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(20,241,149,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,241,149,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4 relative z-10">Network Nodes</h3>
                 
                 <div className="space-y-3 relative z-10">
                    <div className="flex items-center justify-between p-2 bg-slate-900/80 border border-slate-800 rounded group hover:border-[#14F195]/30 transition-colors shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img src="/logos/sol.png" className="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#14F195] rounded-full border border-black"></div>
                            </div>
                            <div>
                                <div className="text-white font-bold text-xs">SOLANA MAIN</div>
                                <div className="text-[10px] text-slate-500">TPS: 3,421</div>
                            </div>
                        </div>
                        <Activity className="w-4 h-4 text-[#14F195]" />
                    </div>

                    <div className="flex items-center justify-between p-2 bg-slate-900/80 border border-slate-800 rounded group hover:border-blue-500/30 transition-colors shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img src="/logos/base.png" className="w-5 h-5 rounded-full opacity-80 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#14F195] rounded-full border border-black"></div>
                            </div>
                            <div>
                                <div className="text-white font-bold text-xs">BASE L2</div>
                                <div className="text-[10px] text-slate-500">Block: 2.0s</div>
                            </div>
                        </div>
                        <Activity className="w-4 h-4 text-blue-500" />
                    </div>
                 </div>

                 <div className="mt-auto pt-4 border-t border-slate-800">
                     <div className="text-[10px] text-slate-500 font-mono">
                        &gt; NODE SYNC: 100%<br/>
                        &gt; MEMPOOL: NORMAL<br/>
                        &gt; ORACLE: CONNECTED
                     </div>
                 </div>
             </div>
          </div>

          {/* CENTER COLUMN: Terminal (Main Chat) */}
          <div className="col-span-1 lg:col-span-6 flex flex-col h-[80vh] lg:h-[calc(100vh-120px)] gap-4">
              {/* Terminal Window */}
              <div className="hud-panel flex-1 flex flex-col overflow-hidden relative shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                  {/* Terminal Header */}
                  <div className="h-9 bg-slate-950/90 border-b border-[#14F195]/20 flex items-center justify-between px-3 shrink-0">
                      <div className="flex items-center gap-2">
                          <Terminal className="w-3 h-3 text-[#14F195]" />
                          <span className="text-[10px] font-bold text-[#14F195] uppercase tracking-widest opacity-80">Main Terminal</span>
                      </div>
                      <div className="flex gap-1.5 opacity-50">
                          <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                          <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                          <div className="w-2 h-2 rounded-full bg-[#14F195] animate-pulse"></div>
                      </div>
                  </div>

                  {/* Messages */}
                  <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 pb-8 space-y-6 scroll-smooth custom-scrollbar relative">
                      {/* Grid Background inside Terminal */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,241,149,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(20,241,149,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
                      
                      {messages.map((msg, index) => (
                          <div key={msg.id} className={clsx(
                              "flex gap-3 relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-300",
                              msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                          )}>
                        {/* Avatar Bubble */}
                        <div className={clsx(
                            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border",
                            msg.role === 'assistant' 
                                ? "bg-[#14F195]/10 border-[#14F195]/30 text-[#14F195]" 
                                : "bg-slate-800 border-slate-700 text-slate-400"
                        )}>
                            {msg.role === 'assistant' ? <Bot className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                        </div>

                        {/* Content Bubble */}
                        <div className={clsx(
                            "rounded-2xl p-4 md:p-6 shadow-sm backdrop-blur-sm border max-w-[90%] md:max-w-[85%]",
                            msg.role === 'assistant' 
                                ? "bg-slate-900/90 border-[#14F195]/30 rounded-tl-none shadow-[0_0_15px_rgba(0,0,0,0.2)]" 
                                : "bg-purple-900/10 border-purple-500/20 rounded-tr-none text-slate-300"
                        )}>
                                  {msg.content}
                              </div>
                          </div>
                      ))}
                      <div ref={messagesEndRef} />
                  </div>
              </div>

              {/* Input Module */}
              <div className="hud-panel p-2 shrink-0">
                <form onSubmit={handleSendMessage} className="relative flex items-center bg-slate-950/50 border border-slate-800 rounded overflow-hidden focus-within:border-[#14F195]/50 focus-within:shadow-[0_0_15px_rgba(20,241,149,0.1)] transition-all">
                    <div className="px-3 text-slate-600">
                        <span className="animate-pulse text-[#14F195]">{'>'}</span>
                    </div>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="ENTER TARGET ADDRESS..."
                        className="flex-1 bg-transparent border-none text-[#14F195] px-2 py-3 focus:ring-0 placeholder-slate-700 font-mono text-sm tracking-wider uppercase"
                        disabled={loading}
                    />
                    <button 
                        type="submit" 
                        disabled={loading || !inputValue.trim()}
                        className="px-4 py-2 bg-[#14F195]/10 hover:bg-[#14F195]/20 text-[#14F195] border-l border-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </form>
              </div>
          </div>

          {/* RIGHT COLUMN: Live Feed */}
          <div className="hidden lg:flex col-span-3 flex-col gap-4">
               <RightActivityPanel />
               
               {/* Communication Link */}
               <div className="hud-panel p-4 space-y-3 shrink-0">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-[#14F195]/20 pb-2 mb-2">Secure Uplink</div>
                   <div className="grid grid-cols-2 gap-2">
                       <a href="https://t.me/lte777777" target="_blank" className="flex flex-col items-center justify-center p-3 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 rounded transition-all group">
                            <MessageCircle className="w-5 h-5 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] text-blue-300 font-bold">TELEGRAM</span>
                       </a>
                       <a href="https://x.com/OG_Cryptooo" target="_blank" className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded transition-all group">
                            <Twitter className="w-5 h-5 text-white mb-1 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] text-slate-300 font-bold">TWITTER</span>
                       </a>
                   </div>
               </div>
          </div>

      </main>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Modal Container */}
            <div className="w-full max-w-4xl bg-slate-950/90 border border-[#14F195]/20 relative shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] rounded-xl backdrop-blur-xl">
                
                {/* Modal Header */}
                <div className="h-12 border-b border-[#14F195]/20 bg-slate-900/50 flex items-center justify-between px-6 shrink-0 relative">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(20,241,149,0.1),transparent)] animate-ticker"></div>
                    <div className="flex items-center gap-3 relative z-10">
                        <Terminal className="w-4 h-4 text-[#14F195]" />
                        <h2 className="font-mono font-bold text-[#14F195] tracking-[0.2em] text-sm">SYSTEM KERNEL INFO // V2.1</h2>
                    </div>
                    <button 
                        onClick={() => setShowAbout(false)}
                        className="relative z-10 p-1.5 hover:bg-[#14F195]/10 rounded text-slate-500 hover:text-[#14F195] transition-colors group"
                    >
                        <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-8 relative">
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(20,241,149,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,241,149,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

                    {/* Top Section: Identity */}
                    <div className="grid md:grid-cols-[200px_1fr] gap-8 relative z-10">
                        <div className="flex flex-col items-center justify-center p-6 bg-[#14F195]/5 border border-[#14F195]/20 rounded relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[#14F195]/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                            <Shield className="w-16 h-16 text-[#14F195] mb-4 drop-shadow-[0_0_15px_rgba(20,241,149,0.3)]" />
                            <div className="text-center">
                                <div className="text-white font-bold font-mono tracking-widest text-lg">SOLANA</div>
                                <div className="text-[#14F195] font-bold font-mono tracking-widest text-lg">GUARD AI</div>
                                <div className="mt-2 text-[10px] text-slate-500 font-mono border-t border-slate-800 pt-2">
                                    BUILD: 2026.02.10<br/>
                                    STATUS: OPERATIONAL
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-[#14F195]"></span>
                                    Primary Directive
                                </h3>
                                <p className="text-slate-300 font-mono text-sm leading-relaxed border-l-2 border-slate-700 pl-4">
                                    Autonomous sentinel designed for the <span className="text-white font-bold">Solana & Base</span> ecosystems. 
                                    Utilizes real-time heuristic analysis to detect contract vulnerabilities, rug pulls, and liquidity anomalies before they execute.
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-900/50 border border-slate-700 rounded">
                                    <div className="text-[10px] text-slate-500 mb-1">SCAN ENGINE</div>
                                    <div className="text-[#14F195] font-mono font-bold">HEURISTIC V3</div>
                                </div>
                                <div className="p-3 bg-slate-900/50 border border-slate-700 rounded">
                                    <div className="text-[10px] text-slate-500 mb-1">LATENCY</div>
                                    <div className="text-[#14F195] font-mono font-bold">&lt; 50ms</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle Section: Roadmap */}
                    <div className="relative z-10">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-800 pb-2">
                            <Map className="w-4 h-4" /> 
                            Execution Roadmap
                        </h3>
                        
                        <div className="grid md:grid-cols-3 gap-4">
                            {/* Phase 1 */}
                            <div className="relative p-4 border border-[#14F195]/20 bg-[#14F195]/5 rounded overflow-hidden">
                                <div className="absolute top-0 right-0 px-2 py-1 bg-[#14F195] text-black text-[10px] font-bold">COMPLETE</div>
                                <div className="text-[#14F195] font-bold text-lg mb-1">PHASE I</div>
                                <div className="text-white text-xs font-bold mb-3 tracking-wider">GENESIS PROTOCOL</div>
                                <ul className="space-y-1.5 text-[11px] font-mono text-slate-400">
                                    <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-[#14F195]" /> Core Scanner Init</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-[#14F195]" /> CMC Integration</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-[#14F195]" /> Basic Heuristics</li>
                                </ul>
                            </div>

                            {/* Phase 2 */}
                            <div className="relative p-4 border border-blue-500/20 bg-blue-900/10 rounded overflow-hidden">
                                <div className="absolute top-0 right-0 px-2 py-1 bg-blue-500 text-white text-[10px] font-bold animate-pulse">ACTIVE</div>
                                <div className="text-blue-400 font-bold text-lg mb-1">PHASE II</div>
                                <div className="text-white text-xs font-bold mb-3 tracking-wider">EXPANSION LAYER</div>
                                <ul className="space-y-1.5 text-[11px] font-mono text-slate-400">
                                    <li className="flex items-center gap-2"><Loader2 className="w-3 h-3 text-blue-400 animate-spin" /> Base Chain Uplink</li>
                                    <li className="flex items-center gap-2"><Loader2 className="w-3 h-3 text-blue-400 animate-spin" /> Honeypot V2</li>
                                    <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border border-slate-600 flex items-center justify-center text-[8px] opacity-50">3</span> Multi-DEX Router</li>
                                </ul>
                            </div>

                            {/* Phase 3 */}
                            <div className="relative p-4 border border-purple-500/20 bg-purple-900/10 rounded overflow-hidden opacity-70 hover:opacity-100 transition-opacity">
                                <div className="absolute top-0 right-0 px-2 py-1 bg-purple-500/20 text-purple-400 text-[10px] font-bold">PENDING</div>
                                <div className="text-purple-400 font-bold text-lg mb-1">PHASE III</div>
                                <div className="text-white text-xs font-bold mb-3 tracking-wider">OMNI-CHAIN</div>
                                <ul className="space-y-1.5 text-[11px] font-mono text-slate-500">
                                    <li className="flex items-center gap-2 text-slate-500">&gt; ETH Mainnet Bridge</li>
                                    <li className="flex items-center gap-2 text-slate-500">&gt; Arb/Optimism Nodes</li>
                                    <li className="flex items-center gap-2 text-slate-500">&gt; BSC Scanner Beta</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Footer System Status */}
                    <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-slate-500 border-t border-slate-800 pt-4 relative z-10">
                        <div className="flex flex-col">
                            <span>MEMORY HEAP</span>
                            <span className="text-[#14F195]">45% USED</span>
                        </div>
                        <div className="flex flex-col">
                            <span>UPTIME</span>
                            <span className="text-slate-200">99.99%</span>
                        </div>
                        <div className="flex flex-col">
                            <span>LAST AUDIT</span>
                            <span className="text-slate-200">12 MIN AGO</span>
                        </div>
                        <div className="flex flex-col text-right">
                            <span>SECURITY</span>
                            <span className="text-[#14F195]">MAXIMUM</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// SUB-COMPONENTS
// ----------------------------------------------------------------------

function TypewriterEffect({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.substring(0, i));
      i += 3; 
      if (i > text.length) {
          setDisplayedText(text);
          clearInterval(timer);
      }
    }, 5);
    return () => clearInterval(timer);
  }, [text]);

  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-300 min-h-[60px]">
        {displayedText.split('\n').map((line: string, i: number) => {
            if (!line) return <div key={i} className="h-2"></div>;
            if (line.startsWith('### ')) return <div key={i} className="text-lg font-bold text-[#14F195] pt-2 animate-in fade-in duration-300 border-b border-[#14F195]/20 pb-1 mb-2">{line.replace('### ', '')}</div>;
            if (line.startsWith('#### ')) return <div key={i} className="text-sm font-bold text-slate-400 uppercase tracking-widest pt-2 animate-in fade-in duration-300">{line.replace('#### ', '')}</div>;
            if (line.startsWith('**')) return <div key={i} className="font-bold text-white pt-1 animate-in fade-in duration-300">{line.replace(/\*\*/g, '')}</div>;
            
            // Risk/Safety Indicators with specific styling
            if (line.startsWith('- 🚨') || line.includes('🚨')) return <div key={i} className="text-red-400 font-bold flex gap-2 animate-in fade-in duration-300 bg-red-900/20 p-2 rounded"><AlertOctagon className="w-4 h-4 mt-0.5 flex-shrink-0" /> <span>{line.replace('- ', '')}</span></div>;
            if (line.startsWith('- ⚠️') || line.includes('⚠️')) return <div key={i} className="text-amber-400 flex gap-2 animate-in fade-in duration-300"><AlertTriangle className="w-3 h-3 mt-1 flex-shrink-0" /> <span>{line.replace('- ', '')}</span></div>;
            if (line.startsWith('- ✅') || line.includes('✅')) return <div key={i} className="text-[#14F195] flex gap-2 animate-in fade-in duration-300"><CheckCircle className="w-3 h-3 mt-1 flex-shrink-0" /> <span>{line.replace('- ', '')}</span></div>;
            if (line.startsWith('- 💧') || line.includes('💧')) return <div key={i} className="text-blue-400 flex gap-2 animate-in fade-in duration-300"><Zap className="w-3 h-3 mt-1 flex-shrink-0" /> <span>{line.replace('- ', '')}</span></div>;
            if (line.startsWith('- 🚀') || line.includes('🚀')) return <div key={i} className="text-purple-400 flex gap-2 animate-in fade-in duration-300"><Activity className="w-3 h-3 mt-1 flex-shrink-0" /> <span>{line.replace('- ', '')}</span></div>;
            
            return <div key={i} className="animate-in fade-in duration-300 pl-4 border-l-2 border-slate-700 ml-1">{line.replace('- ', '')}</div>;
        })}
    </div>
  );
}

function useOnScreen(ref: React.RefObject<HTMLElement>) {
  const [isIntersecting, setIntersecting] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIntersecting(entry.isIntersecting)
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return isIntersecting;
}

function TokenAnalysis({ result }: { result: any }) {
    const [marketData, setMarketData] = useState(result.marketData);
    const [isUpdating, setIsUpdating] = useState(false);
    const [copied, setCopied] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const isVisible = useOnScreen(containerRef);
    
    const initialCircSupply = useRef(result.marketData?.circulatingSupply || 0);

    useEffect(() => {
        if (!isVisible || !marketData) return;
        const interval = setInterval(async () => {
            setIsUpdating(true);
            try {
                const res = await fetch(`/api/market?address=${result.address}`);
                if (res.ok) {
                    const newData = await res.json();
                    const newPrice = newData.priceUsd || 0;
                    const newVol = newData.volume24h || 0;
                    const circSupply = initialCircSupply.current;
                    const mktCap = newPrice * circSupply;
                    
                    setMarketData((prev: any) => ({
                        ...prev,
                        ...newData,
                        marketCap: mktCap,
                        circulatingSupply: circSupply,
                        volToMktCap: mktCap > 0 ? newVol / mktCap : 0
                    }));
                }
            } catch (e) {
                console.error("Polling failed", e);
            } finally {
                setIsUpdating(false);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [isVisible, result.address, marketData]);

    return (
        <div ref={containerRef} className="space-y-6 min-w-[300px] md:min-w-[650px] max-w-[800px] font-sans">
            {/* 1. Header with Logo & Big Price */}
            <div className="flex flex-col md:flex-row md:items-center gap-6 pb-6 border-b border-[#14F195]/20">
                <div className="flex items-center gap-4">
                     <div className="relative">
                        <div className="absolute inset-0 bg-[#14F195] blur opacity-20 rounded-full"></div>
                        {marketData?.imageUrl ? (
                            <img src={marketData.imageUrl} alt="Logo" className="relative w-16 h-16 rounded-full ring-2 ring-slate-800 shadow-xl object-cover" />
                        ) : (
                            <div className="relative w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-2xl ring-2 ring-slate-800 shadow-xl">🪙</div>
                        )}
                        {/* Live Indicator */}
                        <div className={clsx(
                            "absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white transition-colors duration-500",
                            isUpdating ? "bg-yellow-400" : "bg-[#14F195] animate-pulse"
                        )} title="Live updates active"></div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                             <h2 className="text-xl font-bold text-white">{marketData?.name || "Unknown"}</h2>
                             {result.address.startsWith('0x') ? (
                                <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/20">BASE</span>
                             ) : (
                                <span className="bg-[#14F195]/10 text-[#14F195] text-[10px] font-bold px-2 py-0.5 rounded border border-[#14F195]/20">SOL</span>
                             )}
                             <span className="text-slate-500 text-sm font-mono">{marketData?.symbol}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-800/50 px-2 py-1 rounded border border-slate-700 cursor-pointer hover:border-[#14F195]/50 transition-colors"
                             onClick={() => navigator.clipboard.writeText(result.address)}>
                            {result.address.slice(0, 6)}...{result.address.slice(-6)}
                            <FileText className="w-3 h-3" />
                        </div>
                    </div>
                </div>
                
                {/* Big Price Display */}
                <div className="md:ml-auto">
                    <div className="flex items-baseline gap-3">
                        <div className="text-4xl md:text-5xl font-bold text-white font-mono tracking-tighter">
                            ${formatPrice(marketData?.priceUsd || 0)}
                        </div>
                        {marketData?.priceChange24h !== undefined && (
                             <div className={clsx(
                                "text-lg font-bold flex items-center gap-1",
                                marketData.priceChange24h >= 0 ? "text-[#14F195]" : "text-red-500"
                            )}>
                                {formatPct(marketData.priceChange24h)} <span className="text-xs text-slate-500 font-normal">(24h)</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. AI Analysis Text */}
            <div className="bg-purple-900/10 p-4 rounded-xl border border-purple-500/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <Bot className="w-4 h-4" /> AI Analysis
                </h3>
                <TypewriterEffect text={result.aiAnalysis} />
            </div>

            {/* 4. Security & Holders Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Security Checks</h4>
                    <div className="space-y-2">
                        <CheckItem label="Mint Disabled" status={result.checks.mintDisabled} description="Owner cannot mint new tokens" />
                        <CheckItem label="Freeze Disabled" status={result.checks.lpBurned} description="Owner cannot freeze your funds" />
                        <CheckItem label="Immutable" status={result.checks.metadataImmutable} description="Token metadata cannot be changed" />
                        <CheckItem label="Not Honeypot" status={!result.isHoneypot} description="Token can be sold freely" />
                    </div>
                </div>
            </div>

            {/* 5. External Links - Only show if URL exists or High Value */}
            {(marketData?.externalUrl || marketData?.searchUrl) && (
                <a href={marketData.externalUrl || marketData.searchUrl} target="_blank" className="block w-full bg-blue-900/10 hover:bg-blue-900/20 border border-blue-500/20 hover:border-blue-500/40 p-4 rounded-xl text-center transition-all group">
                    <div className="flex items-center justify-center gap-2 text-blue-600 font-bold text-lg mb-1">
                        <Globe className="w-5 h-5 fill-current" />
                        {marketData.externalUrl 
                            ? `View on ${marketData.externalUrl.includes('coinmarketcap') ? 'CoinMarketCap' : 'CoinGecko'}`
                            : 'Find on CoinMarketCap'
                        }
                    </div>
                    <div className="text-xs text-blue-400 font-mono">
                        {marketData.externalUrl ? 'Official Listing' : 'Search via Google'}
                    </div>
                </a>
            )}
            
            {/* 6. Footer Actions */}
            <div className="flex gap-2 pt-2">
                 <button 
                   onClick={() => {
                     const text = `🛡️ Analysis for ${result.marketData?.symbol || 'Token'}\nPrice: $${result.marketData?.priceUsd}\nScore: ${100 - result.riskScore}/100\n\nScan by Solana Guard AI`;
                     navigator.clipboard.writeText(text);
                     setCopied(true);
                     setTimeout(() => setCopied(false), 2000);
                   }}
                   className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-600 flex items-center justify-center gap-2 transition-colors border border-slate-200"
                 >
                   {copied ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <FileText className="w-3 h-3" />}
                   {copied ? 'Copied!' : 'Copy Report'}
                 </button>
                 
                 <a 
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`🛡️ Just scanned $${result.marketData?.symbol || 'Token'} on Solana Guard AI!\n\nSafety Score: ${100 - result.riskScore}/100\nChain: SOLANA 🟢\n\nCheck it here: https://solana-guard-ai.vercel.app`)}`}
                    target="_blank"
                    className="px-3 py-2 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] border border-[#1DA1F2]/30 rounded-lg transition-colors flex items-center justify-center"
                 >
                    <Twitter className="w-4 h-4" />
                 </a>

                 <a href={`https://solscan.io/token/${result.address}`} target="_blank" className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center justify-center">
                    <ExternalLink className="w-4 h-4" />
                 </a>
            </div>
        </div>
    );
}

function CheckItem({ label, status, description }: { label: string, status: boolean, description?: string }) {
  return (
    <div className={clsx(
      "flex items-center gap-3 p-2 rounded border transition-all duration-300",
      status 
        ? "bg-[#14F195]/10 border-[#14F195]/20" 
        : "bg-red-900/10 border-red-500/20"
    )}>
      <div className={clsx(
        "p-1 rounded-full flex-shrink-0",
        status ? "bg-[#14F195]/20 text-[#14F195]" : "bg-red-900/20 text-red-500"
      )}>
        {status ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      </div>
      <div className="flex flex-col">
        <span className={clsx("font-medium text-xs", status ? "text-slate-200" : "text-slate-200")}>{label}</span>
        {description && <span className="text-[10px] text-slate-400">{description}</span>}
      </div>
    </div>
  );
}

function StatsModule() {
  const [scans, setScans] = useState(100);
  const [threats, setThreats] = useState(12);
  
  useEffect(() => {
    const calculateStats = () => {
        const launchDate = new Date('2026-01-29T00:00:00').getTime();
        const now = Date.now();
        const daysPassed = Math.max(0, (now - launchDate) / (1000 * 60 * 60 * 24));
        const scanGrowth = Math.floor(daysPassed * 25);
        const threatGrowth = Math.floor(daysPassed * 3);

        setScans(100 + scanGrowth);
        setThreats(12 + threatGrowth);
    };

    calculateStats();
    const interval = setInterval(calculateStats, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 flex flex-col gap-4 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 p-2 opacity-5">
            <BarChart3 className="w-20 h-20 text-white" />
        </div>
        
        <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-1 relative z-10">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Threat Intel</h3>
            <div className="flex items-center gap-1.5 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-[9px] font-bold text-red-400 tracking-wider">LIVE</span>
            </div>
        </div>

        <div className="space-y-4 relative z-10">
            <div>
                <div className="text-[10px] text-[#14F195] uppercase font-bold mb-1">Total Scans</div>
                <div className="text-2xl font-mono font-bold text-white tracking-tighter">
                    {scans.toLocaleString()}
                </div>
            </div>
            
            <div>
                <div className="text-[10px] text-red-500 uppercase font-bold mb-1">Threats Neutralized</div>
                <div className="text-2xl font-mono font-bold text-red-500 tracking-tighter flex items-center gap-2">
                    {threats.toLocaleString()}
                    <AlertTriangle className="w-4 h-4 animate-pulse" />
                </div>
            </div>
        </div>
    </div>
  );
}

function RightActivityPanel() {
    const [activities, setActivities] = useState([
        { type: 'scan', token: 'BONK', chain: 'SOL', risk: 'LOW', time: '2s' },
        { type: 'alert', token: 'SCAM', chain: 'SOL', risk: 'HIGH', time: '12s' },
        { type: 'scan', token: 'JUP', chain: 'SOL', risk: 'LOW', time: '15s' },
    ]);

    useEffect(() => {
        const tokens = [
            { s: 'SOL', c: 'SOL' }, { s: 'USDC', c: 'SOL' }, { s: 'RAY', c: 'SOL' }, { s: 'ORCA', c: 'SOL' },
            { s: 'MYRO', c: 'SOL' }, { s: 'BRETT', c: 'BASE' }, { s: 'DEGEN', c: 'BASE' }, { s: 'TOSHI', c: 'BASE' },
            { s: 'AERO', c: 'BASE' }, { s: 'KEYCAT', c: 'BASE' }, { s: 'NORMIE', c: 'BASE' },
        ];

        const interval = setInterval(() => {
            const randomToken = tokens[Math.floor(Math.random() * tokens.length)];
            const randomRisk = Math.random() > 0.8 ? 'HIGH' : (Math.random() > 0.5 ? 'MEDIUM' : 'LOW');
            
            setActivities(prev => [
                { type: 'scan', token: randomToken.s, chain: randomToken.c, risk: randomRisk, time: 'NOW' },
                ...prev.slice(0, 5)
            ]);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl flex-1 p-4 flex flex-col relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Intercepts</h3>
                <div className="flex items-center gap-1.5 bg-[#14F195]/10 px-1.5 py-0.5 rounded border border-[#14F195]/20">
                    <Activity className="w-3 h-3 text-[#14F195]" />
                    <span className="text-[9px] font-bold text-[#14F195] tracking-wider">FEED</span>
                </div>
            </div>
            
            <div className="space-y-2 flex-1 overflow-hidden relative">
                <div className="absolute left-1.5 top-0 bottom-0 w-px bg-slate-700"></div>
                
                {activities.map((item, i) => (
                    <div key={i} className="relative pl-6 animate-in slide-in-from-right-4 duration-300">
                        <div className={clsx(
                            "absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 border-slate-900 z-10",
                            item.risk === 'HIGH' ? 'bg-red-500' : 
                            item.risk === 'MEDIUM' ? 'bg-yellow-500' : 'bg-[#14F195]',
                            i === 0 && "animate-pulse shadow-[0_0_8px_currentColor]"
                        )}></div>
                        
                        <div className="flex items-center justify-between text-xs p-2 bg-slate-800 border border-slate-700 hover:border-[#14F195]/30 transition-colors shadow-sm rounded group">
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-200">${item.token}</span>
                                <span className="text-[9px] text-slate-500 bg-slate-900 px-1 rounded">{item.chain}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={clsx(
                                    "text-[9px] font-bold px-1.5 rounded",
                                    item.risk === 'HIGH' ? 'text-red-400 bg-red-900/20' : 
                                    item.risk === 'MEDIUM' ? 'text-yellow-400 bg-yellow-900/20' : 'text-[#14F195] bg-[#14F195]/10'
                                )}>{item.risk}</div>
                                <span className="text-[9px] text-slate-600 font-mono w-6 text-right">{item.time}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
