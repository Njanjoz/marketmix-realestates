import React, { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { MessageCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';

export default function CustomerHelpInbox() {
  const { currentUser, userProfile } = useAuth();
  const [threads, setThreads] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  useEffect(() => onSnapshot(query(collection(db, 'supportConversations'), orderBy('updatedAt', 'desc')), (snap) => {
    const rows = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
    setThreads(rows);
    setSelectedId((current) => current || rows[0]?.id || '');
  }, (error) => toast.error(`Could not load support inbox: ${error.message}`)), []);
  useEffect(() => {
    if (!selectedId) { setMessages([]); return undefined; }
    return onSnapshot(query(collection(db, 'supportConversations', selectedId, 'messages'), orderBy('createdAt', 'asc')), (snap) => {
      setMessages(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
    }, (error) => toast.error(`Could not load conversation: ${error.message}`));
  }, [selectedId]);
  const send = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !selectedId) return;
    const threadRef = doc(db, 'supportConversations', selectedId);
    try {
      await addDoc(collection(threadRef, 'messages'), { senderId: currentUser.uid, senderName: userProfile?.name || 'MarketMix Admin', text, createdAt: serverTimestamp() });
      await updateDoc(threadRef, { lastMessage: text.slice(0, 300), updatedAt: serverTimestamp(), status: 'open' });
      setDraft('');
    } catch (error) { toast.error(`Reply could not be sent: ${error.message}`); }
  };
  const selected = threads.find((thread) => thread.id === selectedId);
  return <main className="min-h-[75vh] bg-slate-50 px-4 py-8 sm:px-6"><div className="mx-auto max-w-7xl"><h1 className="mb-5 flex items-center gap-2 text-2xl font-extrabold text-slate-900"><MessageCircle className="text-emerald-800"/> Customer Help Inbox</h1><div className="grid min-h-[65vh] overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-[320px_1fr]">
    <aside className="border-b border-slate-200 md:border-b-0 md:border-r"><div className="border-b p-4 text-sm font-bold">Customer conversations ({threads.length})</div><div className="max-h-[60vh] overflow-y-auto">{threads.map((thread) => <button key={thread.id} onClick={() => setSelectedId(thread.id)} className={`block w-full border-b p-4 text-left ${selectedId === thread.id ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}><span className="block font-bold text-slate-900">{thread.userName || thread.userEmail || thread.id}</span><span className="mt-1 block truncate text-xs text-slate-500">{thread.lastMessage || 'No messages yet'}</span></button>)}{!threads.length && <p className="p-5 text-sm text-slate-500">No customer conversations yet.</p>}</div></aside>
    <section className="flex min-h-[60vh] flex-col"><div className="border-b p-4"><p className="font-bold">{selected?.userName || 'Select a conversation'}</p><p className="text-xs text-slate-500">{selected?.userEmail}</p></div><div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">{messages.map((message) => <div key={message.id} className={`flex ${message.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${message.senderId === currentUser?.uid ? 'bg-emerald-800 text-white' : 'border bg-white text-slate-800'}`}><p className="mb-1 text-[10px] font-bold opacity-70">{message.senderId === currentUser?.uid ? 'You · Admin' : message.senderName || 'Customer'}</p><p className="whitespace-pre-wrap">{message.text}</p></div></div>)}</div><form onSubmit={send} className="flex gap-2 border-t p-4"><input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={4000} disabled={!selectedId} placeholder="Reply to customer…" className="min-w-0 flex-1 rounded-xl border px-4 py-3 text-sm"/><button disabled={!selectedId || !draft.trim()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><Send size={16}/> Reply</button></form></section>
  </div></div></main>;
}
