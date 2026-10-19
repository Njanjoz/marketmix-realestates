import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, addDoc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, MessageCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

export default function CustomerHelpPage() {
  const { currentUser, userProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  useEffect(() => {
    if (!currentUser) return undefined;
    const conversationRef = doc(db, 'supportConversations', currentUser.uid);
    let unsubscribeMessages;
    setDoc(conversationRef, {
      userId: currentUser.uid,
      userName: userProfile?.name || currentUser.displayName || 'Customer',
      userEmail: currentUser.email || '',
      status: 'open',
      updatedAt: serverTimestamp(),
      lastMessage: '',
    }, { merge: true }).then(() => {
      setReady(true);
      unsubscribeMessages = onSnapshot(query(collection(conversationRef, 'messages'), orderBy('createdAt', 'asc')), (snap) => {
        setMessages(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
      }, (error) => toast.error(`Could not load support messages: ${error.message}`));
    }).catch((error) => toast.error(`Could not open customer help: ${error.message}`));
    return () => unsubscribeMessages?.();
  }, [currentUser?.uid, userProfile?.name]);

  const send = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !currentUser || sending) return;
    setSending(true);
    try {
      const conversationRef = doc(db, 'supportConversations', currentUser.uid);
      await addDoc(collection(conversationRef, 'messages'), {
        senderId: currentUser.uid,
        senderName: userProfile?.name || currentUser.displayName || currentUser.email || 'Customer',
        text,
        createdAt: serverTimestamp(),
      });
      await updateDoc(conversationRef, { lastMessage: text.slice(0, 300), updatedAt: serverTimestamp(), status: 'open' });
      setDraft('');
    } catch (error) {
      toast.error(`Message could not be sent: ${error.message}`);
    } finally { setSending(false); }
  };

  return <main className="min-h-[70vh] bg-slate-50 px-4 py-8 sm:px-6"><section className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <header className="border-b border-slate-100 bg-emerald-950 px-5 py-5 text-white sm:px-7"><Link to="/site-seeing" className="inline-flex items-center gap-2 text-xs text-emerald-100"><ArrowLeft size={15}/> Back to viewings</Link><h1 className="mt-3 flex items-center gap-2 text-2xl font-extrabold"><MessageCircle/> Customer help</h1><p className="mt-1 text-sm text-emerald-100">Send a message directly to the MarketMix admin team. Include your booking or payment reference if you have one.</p></header>
    <div className="min-h-[360px] max-h-[55vh] space-y-3 overflow-y-auto bg-slate-50 p-5" aria-live="polite">
      {!messages.length && <div className="mx-auto mt-20 max-w-sm text-center text-sm text-slate-500">{ready ? 'Ask us about your booking, M-Pesa payment, or account. We will reply here.' : 'Opening your support conversation…'}</div>}
      {messages.map((message) => <div key={message.id} className={`flex ${message.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${message.senderId === currentUser?.uid ? 'bg-emerald-800 text-white' : 'border border-slate-200 bg-white text-slate-800'}`}><p className="mb-1 text-[10px] font-bold opacity-70">{message.senderId === currentUser?.uid ? 'You' : message.senderName || 'MarketMix Support'}</p><p className="whitespace-pre-wrap">{message.text}</p></div></div>)}
    </div>
    <form onSubmit={send} className="flex gap-2 border-t border-slate-100 p-4"><input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={4000} placeholder="Write a message to the admin team…" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-700"/><button disabled={!draft.trim() || sending || !ready} className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><Send size={16}/> Send</button></form>
  </section></main>;
}
