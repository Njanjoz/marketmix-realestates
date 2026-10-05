import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { ArrowLeft, Loader, MessageCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { getPublicProperty } from '../../services/propertyService';
import {
  getConversationMessages,
  getConversationRef,
  getRoommateConversationMessages,
  getRoommateConversationRef,
  openPropertyConversation,
} from '../../services/messagingService';

const formatTime = (timestamp) => {
  if (!timestamp?.toDate) return 'Sending…';
  return timestamp.toDate().toLocaleString();
};

const MessagesPage = () => {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedConversationId = searchParams.get('conversationId') || '';
  const requestedPropertyId = searchParams.get('propertyId') || '';
  const requestedUserId = searchParams.get('userId') || '';
  const [propertyConversations, setPropertyConversations] = useState([]);
  const [roommateConversations, setRoommateConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(requestedConversationId);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [startingConversation, setStartingConversation] = useState(false);
  const [sending, setSending] = useState(false);
  const endOfMessagesRef = useRef(null);
  const conversations = useMemo(() => [...propertyConversations, ...roommateConversations].sort((a, b) => {
    const timeA = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0;
    const timeB = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0;
    return timeB - timeA;
  }), [propertyConversations, roommateConversations]);
  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId);
  const isRoommateConversation = activeConversation?.conversationType === 'roommate' || activeConversationId.startsWith('roommate_');

  useEffect(() => {
    if (!currentUser?.uid) {
      setPropertyConversations([]);
      setRoommateConversations([]);
      setLoading(false);
      return undefined;
    }
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', currentUser.uid)
    );
    const roommateQuery = query(
      collection(db, 'roommateConversations'),
      where('participantIds', 'array-contains', currentUser.uid)
    );
    let subscriptionsLoaded = 0;
    const markLoaded = () => {
      subscriptionsLoaded += 1;
      if (subscriptionsLoaded >= 2) setLoading(false);
    };
    const unsubscribeProperties = onSnapshot(conversationsQuery, (snapshot) => {
      setPropertyConversations(snapshot.docs.map((conversationDoc) => ({
        id: conversationDoc.id,
        ...conversationDoc.data(),
      })));
      markLoaded();
    }, (error) => {
      console.error('Error loading conversations:', error);
      toast.error('Could not load your conversations');
      markLoaded();
    });
    const unsubscribeRoommates = onSnapshot(roommateQuery, (snapshot) => {
      setRoommateConversations(snapshot.docs.map((conversationDoc) => ({
        id: conversationDoc.id,
        ...conversationDoc.data(),
      })));
      markLoaded();
    }, (error) => {
      console.error('Error loading roommate conversations:', error);
      toast.error('Could not load roommate conversations');
      markLoaded();
    });
    return () => { unsubscribeProperties(); unsubscribeRoommates(); };
  }, [currentUser]);

  useEffect(() => {
    if (!requestedConversationId) return;
    setActiveConversationId(requestedConversationId);
  }, [requestedConversationId]);

  useEffect(() => {
    if (!currentUser?.uid || !requestedPropertyId || !requestedUserId || requestedConversationId) return undefined;
    let cancelled = false;

    const startConversation = async () => {
      setStartingConversation(true);
      try {
        const property = await getPublicProperty(requestedPropertyId);
        if (!property?.userId) throw new Error('This property has no available seller account.');

        const isSeller = currentUser.uid === property.userId;
        const otherUserId = isSeller ? requestedUserId : property.userId;
        if (!isSeller && requestedUserId !== property.userId) {
          throw new Error('This conversation does not match the property seller.');
        }

        let otherUserName = property.userName || 'MarketMix member';
        if (isSeller) {
          const viewerSnapshot = await getDoc(doc(db, 'propertyViews', `${property.id}_${otherUserId}`));
          otherUserName = viewerSnapshot.data()?.viewerName || 'MarketMix member';
        }

        const conversationId = await openPropertyConversation({
          property,
          currentUser,
          otherUserId,
          otherUserName,
        });
        if (cancelled) return;
        setActiveConversationId(conversationId);
        setSearchParams({ conversationId }, { replace: true });
      } catch (error) {
        console.error('Unable to open conversation:', error);
        toast.error(error.message || 'Could not open this conversation');
      } finally {
        if (!cancelled) setStartingConversation(false);
      }
    };

    startConversation();
    return () => { cancelled = true; };
  }, [currentUser, requestedConversationId, requestedPropertyId, requestedUserId, setSearchParams]);

  useEffect(() => {
    if (!activeConversationId || !currentUser?.uid) {
      setMessages([]);
      return undefined;
    }
    const messagesCollection = isRoommateConversation
      ? getRoommateConversationMessages(activeConversationId)
      : getConversationMessages(activeConversationId);
    return onSnapshot(
      query(messagesCollection, orderBy('createdAt', 'asc')),
      (snapshot) => setMessages(snapshot.docs.map((messageDoc) => ({ id: messageDoc.id, ...messageDoc.data() }))),
      (error) => {
        console.error('Error loading messages:', error);
        toast.error('Could not load these messages');
      }
    );
  }, [activeConversationId, currentUser, isRoommateConversation]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const otherParticipantId = activeConversation?.participantIds?.find((uid) => uid !== currentUser?.uid);
  const otherParticipantName = activeConversation?.participantNames?.[otherParticipantId] || 'MarketMix member';

  const handleSend = async (event) => {
    event.preventDefault();
    const text = messageText.trim();
    if (!text || !activeConversationId || !currentUser?.uid || sending) return;

    setSending(true);
    try {
      const messagesCollection = isRoommateConversation
        ? getRoommateConversationMessages(activeConversationId)
        : getConversationMessages(activeConversationId);
      const conversationRef = isRoommateConversation
        ? getRoommateConversationRef(activeConversationId)
        : getConversationRef(activeConversationId);
      await addDoc(messagesCollection, {
        senderId: currentUser.uid,
        senderName: 'MarketMix member',
        text,
        createdAt: serverTimestamp(),
      });
      await updateDoc(conversationRef, {
        lastMessage: text.slice(0, 200),
        updatedAt: serverTimestamp(),
      });
      setMessageText('');
    } catch (error) {
      console.error('Could not send message:', error);
      toast.error('Message could not be sent');
    } finally {
      setSending(false);
    }
  };

  const openConversation = (conversationId) => {
    setActiveConversationId(conversationId);
    setSearchParams({ conversationId });
  };

  return (
    <DashboardLayout title="Messages" subtitle="Chat privately about properties and roommate matches">
      <div className="grid min-h-[620px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[300px_minmax(0,1fr)]">
        <aside className={`${activeConversationId ? 'hidden md:block' : 'block'} border-b border-slate-200 md:border-b-0 md:border-r`}>
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Conversations</h2>
            <p className="mt-1 text-xs text-slate-500">Private property and roommate conversations</p>
          </div>
          {loading ? (
            <div className="flex justify-center p-8"><Loader className="h-5 w-5 animate-spin text-emerald-600" /></div>
          ) : conversations.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-500">No messages yet. Start from a property page or accept a roommate connection.</div>
          ) : (
            <div className="max-h-[620px] overflow-y-auto p-2">
              {conversations.map((conversation) => {
                const otherId = conversation.participantIds?.find((uid) => uid !== currentUser?.uid);
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => openConversation(conversation.id)}
                    className={`mb-1 w-full rounded-xl p-3 text-left transition ${activeConversationId === conversation.id ? 'bg-emerald-50 ring-1 ring-emerald-100' : 'hover:bg-slate-50'}`}
                  >
                    <span className="block truncate text-sm font-semibold text-slate-900">
                      {conversation.participantNames?.[otherId] || 'MarketMix member'}
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-500">{conversation.title || conversation.propertyTitle || 'Property listing'}</span>
                    {conversation.lastMessage && <span className="mt-1 block truncate text-xs text-slate-400">{conversation.lastMessage}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <section className={`${activeConversationId ? 'flex' : 'hidden md:flex'} min-h-[620px] min-w-0 flex-col`}>
          {startingConversation ? (
            <div className="flex flex-1 items-center justify-center gap-2 text-sm text-slate-500"><Loader className="h-5 w-5 animate-spin" />Opening conversation…</div>
          ) : activeConversationId ? (
            <>
              <header className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
                <button type="button" onClick={() => { setActiveConversationId(''); setSearchParams({}); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden" aria-label="Back to conversations">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-700"><MessageCircle className="h-5 w-5" /></div>
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-slate-900">{activeConversation?.title || activeConversation?.propertyTitle || otherParticipantName}</h2>
                  <p className="truncate text-xs text-slate-500">Chat with {otherParticipantName}</p>
                </div>
              </header>
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-slate-50/70 p-4 sm:p-6">
                {messages.length === 0 && <p className="m-auto max-w-sm text-center text-sm text-slate-500">Say hello and start a private conversation.</p>}
                {messages.map((message) => {
                  const mine = message.senderId === currentUser?.uid;
                  return (
                    <article key={message.id} className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[75%] ${mine ? 'ml-auto rounded-br-md bg-emerald-600 text-white' : 'mr-auto rounded-bl-md border border-slate-200 bg-white text-slate-800'}`}>
                      {!mine && <p className="mb-1 text-[11px] font-semibold text-emerald-700">{message.senderName || otherParticipantName}</p>}
                      <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>
                      <time className={`mt-1 block text-right text-[10px] ${mine ? 'text-emerald-100' : 'text-slate-400'}`}>{formatTime(message.createdAt)}</time>
                    </article>
                  );
                })}
                <div ref={endOfMessagesRef} />
              </div>
              <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-slate-100 p-3 sm:p-4">
                <textarea
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }}
                  maxLength={4000}
                  rows={2}
                  placeholder="Write a message…"
                  className="max-h-32 min-h-11 flex-1 resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
                <button type="submit" disabled={!messageText.trim() || sending} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Send message">
                  {sending ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            </>
          ) : (
            <div className="m-auto max-w-sm px-6 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-700"><MessageCircle className="h-6 w-6" /></div>
              <h2 className="font-semibold text-slate-900">Your conversations</h2>
              <p className="mt-2 text-sm text-slate-500">Choose a conversation or start one from a property or roommate profile.</p>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default MessagesPage;
