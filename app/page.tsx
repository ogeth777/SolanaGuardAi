'use client';

import { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, CheckCircle, Search, Loader2, ExternalLink, Globe, Twitter, DollarSign, BarChart3, Lock, FileText, Activity, Zap, Users, AlertOctagon, Heart, Coffee, History, ArrowRight, Bot, MessageCircle, Send } from 'lucide-react';
import clsx from 'clsx';
import { formatNumber } from '@/lib/utils';
import { generateRiskSummary } from '@/lib/ai-summary';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial Greeting
  useEffect(() => {
    setMessages([
      {
        id: 'init',
        role: 'assistant',
        content: (
            <div className="space-y-2">
                <p>Hello! I am <span className="text-cyan-400 font-bold">Solana Guard AI</span>.</p>
                <p>I can audit any Solana token for security risks, honeypots, and whale manipulation.</p>
                <p className="text-slate-400 text-sm">Paste a token address below to start analyzing.</p>
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
        content: <div className="font-mono text-cyan-200">{address}</div>, 
        timestamp: Date.now() 
    }]);

    setLoading(true);

    // 2. AI Thinking Message
    const loadingId = 'loading-' + Date.now();
    setMessages(prev => [...prev, { 
        id: loadingId, 
        role: 'assistant', 
        content: <div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Analyzing blockchain data...</div>, 
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
        content: <TokenAnalysis result={result} />
      } : m));

    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === loadingId ? {
        ...m,
        content: (
            <div className="flex items-center gap-3 text-red-400 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                    <div className="font-bold">Scan Failed</div>
                    <div className="text-sm opacity-80">{err.message || "Could not fetch token data."}</div>
                </div>
            </div>
        )
      } : m));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col h-screen cyber-grid font-sans selection:bg-cyan-500/30 overflow-hidden">
      {/* Header */}
      <header className="flex-none p-6 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-20 relative shadow-2xl">
        <div className="flex items-center gap-4">
            <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 blur opacity-60 rounded-full animate-pulse"></div>
                <Shield className="w-10 h-10 text-cyan-400 relative z-10 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
            </div>
            <h1 className="font-bold text-3xl tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                SOLANA GUARD <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">AI</span>
            </h1>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        {messages.map((msg) => (
            <div key={msg.id} className={clsx(
                "flex gap-4 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}>
                {/* Avatar */}
                <div className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border",
                    msg.role === 'assistant' 
                        ? "bg-slate-900 border-cyan-500/30 text-cyan-400" 
                        : "bg-slate-800 border-slate-700 text-slate-300"
                )}>
                    {msg.role === 'assistant' ? <Bot className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                </div>

                {/* Content Bubble */}
                <div className={clsx(
                    "rounded-2xl p-4 md:p-6 shadow-xl backdrop-blur-sm border max-w-[90%] md:max-w-[85%]",
                    msg.role === 'assistant' 
                        ? "bg-slate-900/60 border-slate-800 rounded-tl-none" 
                        : "bg-cyan-950/30 border-cyan-500/20 rounded-tr-none"
                )}>
                    {msg.content}
                </div>
            </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-none p-4 bg-slate-950/80 backdrop-blur-md border-t border-slate-800/50 z-20">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative flex items-center bg-slate-900 rounded-xl border border-slate-700/50 focus-within:border-cyan-500/50 overflow-hidden p-1 shadow-2xl">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter Token Address (e.g. 7ey...)"
                    className="flex-1 bg-transparent border-none text-white px-4 py-3 focus:ring-0 placeholder-slate-500 font-mono"
                    disabled={loading}
                />
                <button 
                    type="submit" 
                    disabled={loading || !inputValue.trim()}
                    className="p-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
            </div>
        </form>
        
        {/* Contact / Feedback Section */}
        <div className="max-w-4xl mx-auto mt-4 pt-4 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
             <div className="flex items-center gap-6">
                <span className="font-bold text-cyan-400 uppercase tracking-wider text-xs drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">Support & Feedback:</span>
                <a href="https://t.me/lte777777" target="_blank" className="flex items-center gap-2 text-white hover:text-cyan-300 transition-colors font-medium drop-shadow-[0_0_5px_rgba(255,255,255,0.6)] hover:drop-shadow-[0_0_10px_rgba(34,211,238,1)]">
                    <MessageCircle className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" /> Telegram
                </a>
                <a href="https://x.com/OG_Cryptooo" target="_blank" className="flex items-center gap-2 text-white hover:text-cyan-300 transition-colors font-medium drop-shadow-[0_0_5px_rgba(255,255,255,0.6)] hover:drop-shadow-[0_0_10px_rgba(34,211,238,1)]">
                    <Twitter className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" /> Twitter
                </a>
             </div>
             <div className="text-xs text-purple-300 font-medium drop-shadow-[0_0_5px_rgba(168,85,247,0.6)]">
                Solana Guard AI can make mistakes. Always DYOR.
             </div>
        </div>
      </div>
    </main>
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
    }, 10);
    return () => clearInterval(timer);
  }, [text]);

  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-300 min-h-[60px]">
        {displayedText.split('\n').map((line: string, i: number) => {
            if (!line) return <div key={i} className="h-2"></div>;
            if (line.startsWith('**')) return <div key={i} className="font-bold text-white pt-2 animate-in fade-in duration-300">{line.replace(/\*\*/g, '')}</div>;
            if (line.startsWith('✅')) return <div key={i} className="text-green-400 flex gap-2 animate-in fade-in duration-300"><CheckCircle className="w-3 h-3 mt-1 flex-shrink-0" /> <span>{line.substring(2)}</span></div>;
            if (line.startsWith('⚠️')) return <div key={i} className="text-yellow-400 flex gap-2 animate-in fade-in duration-300"><AlertTriangle className="w-3 h-3 mt-1 flex-shrink-0" /> <span>{line.substring(2)}</span></div>;
            return <div key={i} className="animate-in fade-in duration-300">{line}</div>;
        })}
    </div>
  );
}

function TokenAnalysis({ result }: { result: any }) {
    const COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'];

    return (
        <div className="space-y-6 min-w-[300px] md:min-w-[600px]">
            {/* 1. Header with Logo & Name */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-700/50">
                <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500 blur opacity-20 rounded-full"></div>
                    {result.marketData?.imageUrl ? (
                        <img src={result.marketData.imageUrl} alt="Logo" className="relative w-16 h-16 rounded-full ring-2 ring-slate-700 shadow-xl object-cover" />
                    ) : (
                        <div className="relative w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-2xl ring-2 ring-slate-700 shadow-xl">🪙</div>
                    )}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        {result.marketData?.name || "Unknown Token"}
                        {result.marketData?.symbol && <span className="text-cyan-400 font-mono text-lg">#{result.marketData.symbol}</span>}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-950/30 px-2 py-1 rounded border border-slate-800/50">
                        {result.address.slice(0, 6)}...{result.address.slice(-6)}
                        <button onClick={() => navigator.clipboard.writeText(result.address)} className="hover:text-cyan-400 transition-colors" title="Copy">
                            <FileText className="w-3 h-3" />
                        </button>
                    </div>
                </div>
                <div className="ml-auto flex flex-col items-end">
                    <div className={clsx("text-2xl font-bold", result.riskScore > 50 ? "text-red-500" : "text-green-500")}>
                        {result.riskScore}/100
                    </div>
                    <div className="text-[10px] uppercase text-slate-500 tracking-widest font-bold">Risk Score</div>
                </div>
            </div>

            {/* 2. AI Analysis Text */}
            <div className="bg-slate-950/30 p-4 rounded-xl border border-purple-500/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/50"></div>
                <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <Bot className="w-4 h-4" /> AI Analysis
                </h3>
                <TypewriterEffect text={result.aiAnalysis} />
            </div>

            {/* 3. Stats Grid */}
            {result.marketData && (
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={<DollarSign className="w-3 h-3 text-green-400" />} label="Price" value={`$${result.marketData.priceUsd?.toFixed(8)}`} />
                <StatCard icon={<Lock className="w-3 h-3 text-blue-400" />} label="Liquidity" value={`$${formatNumber(result.marketData.liquidityUsd)}`} />
                <StatCard icon={<Activity className="w-3 h-3 text-purple-400" />} label="Vol 24h" value={`$${formatNumber(result.marketData.volume24h)}`} />
                <StatCard icon={<Zap className="w-3 h-3 text-yellow-400" />} label="FDV" value={`$${formatNumber(result.marketData.fdv)}`} />
              </div>
            )}

            {/* 4. Security & Holders Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Security Checks</h4>
                    <div className="space-y-2">
                        <CheckItem label="Mint Disabled" status={result.checks.mintDisabled} />
                        <CheckItem label="Freeze Disabled" status={result.checks.lpBurned} />
                        <CheckItem label="Immutable" status={result.checks.metadataImmutable} />
                        <CheckItem label="Not Honeypot" status={!result.isHoneypot} />
                    </div>
                </div>

                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Holders</h4>
                    <div className="h-40 relative">
                        <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                               <Pie
                                 data={result.topHolders.slice(0, 5)}
                                 cx="50%" cy="50%"
                                 innerRadius={30} outerRadius={50}
                                 paddingAngle={5}
                                 dataKey="percentage"
                                 stroke="none"
                               >
                                 {result.topHolders.slice(0, 5).map((entry: any, index: number) => (
                                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                 ))}
                               </Pie>
                               <Tooltip 
                                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '12px' }}
                                  itemStyle={{ color: '#94a3b8' }}
                                  formatter={(value: any) => `${Number(value).toFixed(2)}%`}
                               />
                             </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-lg font-bold text-white">
                                {(result.topHolders?.slice(0, 5).reduce((acc: any, curr: any) => acc + curr.percentage, 0) || 0).toFixed(0)}%
                            </span>
                            <span className="text-[8px] text-slate-500 uppercase">Top 5</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. Trade Action */}
            <a href="https://photon-sol.tinyastro.io/@ogbase" target="_blank" className="block w-full bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 hover:border-yellow-500 p-4 rounded-xl text-center transition-all group">
                <div className="flex items-center justify-center gap-2 text-yellow-400 font-bold text-lg mb-1">
                    <Zap className="w-5 h-5 fill-current" />
                    Trade on Photon
                </div>
                <div className="text-xs text-yellow-200/50 font-mono">Fastest Solana Terminal</div>
            </a>
            
            {/* 6. Footer Actions */}
            <div className="flex gap-2 pt-2">
                 <button 
                   onClick={() => {
                     const text = `🛡️ Analysis for ${result.marketData?.symbol || 'Token'}\nRisk Score: ${result.riskScore}/100\nVerdict: ${result.verdict}\n\nScan by Solana Guard AI`;
                     navigator.clipboard.writeText(text);
                   }}
                   className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300 flex items-center justify-center gap-2 transition-colors"
                 >
                   <ArrowRight className="w-3 h-3" /> Share Report
                 </button>
                 <a href={`https://solscan.io/token/${result.address}`} target="_blank" className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <ExternalLink className="w-4 h-4" />
                 </a>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 hover:border-cyan-500/30 transition-colors">
      <div className="text-slate-500 text-[10px] uppercase mb-1 flex items-center gap-1 font-bold tracking-wider">
        {icon} {label}
      </div>
      <div className="font-mono text-sm font-bold text-white tracking-tight truncate" title={value}>{value}</div>
    </div>
  );
}

function CheckItem({ label, status }: { label: string, status: boolean }) {
  return (
    <div className={clsx(
      "flex items-center gap-3 p-2 rounded border transition-all duration-300",
      status 
        ? "bg-green-500/5 border-green-500/10" 
        : "bg-red-500/5 border-red-500/10"
    )}>
      <div className={clsx(
        "p-1 rounded-full",
        status ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
      )}>
        {status ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      </div>
      <span className={clsx("font-medium text-xs", status ? "text-slate-300" : "text-slate-300")}>{label}</span>
    </div>
  );
}
