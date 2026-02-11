"use client";

import { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Zap,
  Menu,
  Undo2,
  Redo2,
  Save,
  Trash2,
  MoreVertical,
  ChevronLeft,
  Moon,
  Sun,
  Layers,
  HelpCircle,
  StopCircle,
  Loader2
} from 'lucide-react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface EchoSession {
  id: string;
  title: string;
  transcript: string;
  timestamp: string;
}

export default function ParadoxNote() {
  // --- UI State ---
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [view, setView] = useState<'chat' | 'help' | 'about'>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<EchoSession[]>([]);

  // --- Engine State ---
  const [isRecording, setIsRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState('System Online');
  const [draft, setDraft] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // --- Refs ---
  const worker = useRef<Worker | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioCtx = useRef<AudioContext | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // --- Life Cycle ---
  useEffect(() => {
    const savedTheme = localStorage.getItem('paradox-theme') as 'light' | 'dark';
    if (savedTheme) setTheme(savedTheme);
    loadSessions();
    initWorker();
    return () => worker.current?.terminate();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('paradox-theme', theme);
  }, [theme]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, draft, processing]);

  // --- Core Methods ---
  const initWorker = () => {
    if (!worker.current && typeof window !== 'undefined') {
      worker.current = new Worker('/whisper-worker.js', { type: 'module' });
      worker.current.onmessage = (e) => {
        const { status, message, output, error } = e.data;
        if (status === 'loading') setStatus(message);
        if (status === 'ready') setStatus('Neural Link Active');
        if (status === 'complete') {
          setDraft(output);
          pushToHistory(output);
          setProcessing(false);
          setStatus('Ready');
        }
        if (status === 'error') {
          setStatus(`Fault: ${error}`);
          setProcessing(false);
        }
      };
      worker.current.postMessage({ type: 'init' });
    }
  };

  const loadSessions = async () => {
    try {
      const result = await Filesystem.readdir({ path: 'sessions', directory: Directory.Data });
      const loaded: EchoSession[] = [];
      for (const file of result.files) {
        if (file.name.endsWith('.md')) {
          const content = await Filesystem.readFile({ path: `sessions/${file.name}`, directory: Directory.Data, encoding: Encoding.UTF8 });
          const parts = (content.data as string).split('---');
          if (parts.length >= 3) {
            const yaml = parts[1];
            const body = parts.slice(2).join('---').trim();
            loaded.push({
              id: yaml.match(/id: (.*)/)?.[1] || '',
              title: yaml.match(/title: (.*)/)?.[1] || 'Draft',
              transcript: body,
              timestamp: yaml.match(/created: (.*)/)?.[1] || ''
            });
          }
        }
      }
      setSessions(loaded.sort((a, b) => a.id.localeCompare(b.id)));
    } catch (e) {
      await Filesystem.mkdir({ path: 'sessions', directory: Directory.Data, recursive: true }).catch(() => { });
    }
  };

  const startCapture = async () => {
    try {
      setStatus('Waking Engine...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.current.state === 'suspended') await audioCtx.current.resume();

      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
      mediaRecorder.current.onstop = processAudio;

      mediaRecorder.current.start();
      setIsRecording(true);
      setStatus('Listening...');
      Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {
      setStatus('Mic Not Found');
    }
  };

  const stopCapture = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
      setProcessing(true);
      Haptics.impact({ style: ImpactStyle.Medium });
    }
  };

  const processAudio = async () => {
    const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
    const arrayBuffer = await audioBlob.arrayBuffer();
    const tempCtx = new AudioContext();
    const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
    worker.current?.postMessage({ audio: audioBuffer.getChannelData(0) });
    tempCtx.close();
  };

  const pushToHistory = (text: string) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(text);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setDraft(history[historyIndex - 1]);
      setHistoryIndex(historyIndex - 1);
      Haptics.impact({ style: ImpactStyle.Light });
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setDraft(history[historyIndex + 1]);
      setHistoryIndex(historyIndex + 1);
      Haptics.impact({ style: ImpactStyle.Light });
    }
  };

  const save = async () => {
    if (!draft.trim()) return;
    const id = Date.now().toString();
    const date = new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
    const content = `---\nid: ${id}\ntitle: ${draft.slice(0, 30)}...\ncreated: ${date}\n---\n\n${draft}`;
    await Filesystem.writeFile({ path: `sessions/${id}.md`, data: content, directory: Directory.Data, encoding: Encoding.UTF8 });
    setDraft("");
    setHistory([]);
    setHistoryIndex(-1);
    loadSessions();
    Haptics.impact({ style: ImpactStyle.Medium });
  };

  return (
    <div className="app-shell">
      <div className="mesh-bg" />

      {/* Sidebar Overlay */}
      <div className={`sidebar ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
        <div className="sidebar-content" onClick={e => e.stopPropagation()}>
          <h2 className="brand-text mb-12">PARADOX<span>NOTE</span></h2>
          <nav className="space-y-6">
            <button className="flex items-center gap-4 w-full p-4 rounded-3xl hover:bg-black/5 dark:hover:bg-white/5 font-bold transition-all" onClick={() => { setView('chat'); setSidebarOpen(false); }}>
              <Layers size={20} className="text-blue-500" /> Timeline
            </button>
            <button className="flex items-center gap-4 w-full p-4 rounded-3xl hover:bg-black/5 dark:hover:bg-white/5 font-bold transition-all" onClick={() => { setView('help'); setSidebarOpen(false); }}>
              <HelpCircle size={20} className="text-blue-500" /> Manual
            </button>
            <button className="flex items-center gap-4 w-full p-4 rounded-3xl hover:bg-black/5 dark:hover:bg-white/5 font-bold transition-all" onClick={() => { setView('about'); setSidebarOpen(false); }}>
              <Zap size={20} className="text-blue-500" /> Architect
            </button>
          </nav>
          <div className="absolute bottom-10 left-6 right-6">
            <button className="w-full p-4 rounded-3xl bg-black/5 dark:bg-white/5 flex items-center justify-between font-bold text-xs uppercase tracking-widest" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? 'Stealth Dark' : 'Vibrant Light'}
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="header">
        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2"><Menu size={24} /></button>
        <h1 className="brand-text">PARADOX<span>NOTE</span></h1>
        <button className="p-2 -mr-2 opacity-30"><MoreVertical size={20} /></button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {view === 'chat' ? (
          <>
            <div className="chat-container">
              <div className="chat-bubble ai-bubble self-start">
                <p className="text-[10px] font-bold opacity-40 uppercase mb-1">System Greeting</p>
                How can I help you today, Natnael?
              </div>

              {sessions.map(s => (
                <div key={s.id} className="chat-bubble user-bubble">
                  <p className="text-[10px] font-bold opacity-60 uppercase mb-1">{s.timestamp}</p>
                  {s.transcript}
                </div>
              ))}

              {processing && (
                <div className="chat-bubble ai-bubble flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                </div>
              )}

              {draft && (
                <div className="chat-bubble user-bubble bg-blue-600/80 backdrop-blur-sm border border-blue-400/30">
                  <p className="text-[10px] font-bold opacity-60 uppercase mb-1">Drafting Memory</p>
                  <textarea
                    className="w-full bg-transparent border-none outline-none resize-none text-white font-medium"
                    value={draft}
                    autoFocus
                    onChange={(e) => { setDraft(e.target.value); pushToHistory(e.target.value); }}
                  />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Simple Status */}
            <div className="text-center py-2 h-6">
              <span className="status-label">{status}</span>
            </div>

            {/* Action Center - Simple interaction flow */}
            <div className="action-center">
              {draft && !isRecording && (
                <div className="context-bar animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <button className="context-btn" onClick={undo} disabled={historyIndex <= 0}><Undo2 size={18} /></button>
                  <button className="context-btn" onClick={redo} disabled={historyIndex >= history.length - 1}><Redo2 size={18} /></button>
                  <div className="w-[1px] h-6 bg-black/10 dark:bg-white/10 mx-1" />
                  <button className="context-btn text-red-500" onClick={() => setDraft("")}><Trash2 size={18} /></button>
                  <button className="context-btn text-blue-500" onClick={save}><Save size={18} /></button>
                </div>
              )}

              <button
                className={`mic-orb ${isRecording ? 'recording' : ''}`}
                onClick={isRecording ? stopCapture : startCapture}
              >
                {isRecording ? <StopCircle size={32} /> : <Mic size={32} />}
              </button>
            </div>
          </>
        ) : view === 'help' ? (
          <div className="flex-1 p-6 overflow-y-auto">
            <button onClick={() => setView('chat')} className="flex items-center gap-2 text-blue-500 font-bold mb-8 uppercase text-[10px] tracking-widest">
              <ChevronLeft size={16} /> Close Manual
            </button>
            <h2 className="text-2xl font-black mb-8">System Manual</h2>
            <div className="space-y-4">
              <div className="p-6 bg-black/5 dark:bg-white/5 rounded-3xl">
                <p className="text-blue-500 font-bold text-xs uppercase mb-2">Capture</p>
                <p className="text-sm opacity-60">Tap the central orb to initiate voice capture. The system transcribes your thoughts locally.</p>
              </div>
              <div className="p-6 bg-black/5 dark:bg-white/5 rounded-3xl">
                <p className="text-blue-500 font-bold text-xs uppercase mb-2">Refine</p>
                <p className="text-sm opacity-60">Use the floating tools above the orb to Undo, Redo, or Save your draft to the timeline.</p>
              </div>
              <div className="p-6 bg-black/5 dark:bg-white/5 rounded-3xl">
                <p className="text-blue-500 font-bold text-xs uppercase mb-2">Sovereignty</p>
                <p className="text-sm opacity-60">Your data never leaves this device. No servers. No telemetry. Pure privacy.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-6 flex flex-col items-center justify-center">
            <div className="about-card w-full max-w-[280px]">
              <div className="w-20 h-20 bg-blue-500 rounded-[32px] mx-auto flex items-center justify-center shadow-2xl shadow-blue-500/40">
                <Zap size={40} className="text-white fill-white" />
              </div>
              <h3 className="architect-name">Natnael Ermiyas</h3>
              <p className="studio-name">Ethco Coders</p>
              <div className="mt-8 pt-8 border-t border-black/10 dark:border-white/10 opacity-30 text-[9px] uppercase font-black tracking-widest space-y-2">
                <p>Paradox OS Engine v2.5</p>
                <p>Neural Compute: Local</p>
              </div>
            </div>
            <button onClick={() => setView('chat')} className="mt-12 text-blue-500 font-black uppercase text-[10px] tracking-widest underline">Return to Core</button>
          </div>
        )}
      </main>
    </div>
  );
}
