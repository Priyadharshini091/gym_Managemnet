import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, MessageCircleMore, SendHorizontal, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { useAuthStore } from '../../store/authStore';

const QUICK_REPLIES = ["Today's classes", 'Book a class', 'My plan'];
const YES_REPLIES = ['yes', 'y', 'yeah', 'yep', 'sure', 'ok', 'okay', 'confirm', 'go ahead', 'do it', 'please do'];
const NO_REPLIES = ['no', 'n', 'nope', 'cancel', 'stop', 'not now'];

function buildLocalMessage(role, content) {
  return {
    id: `local-${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    timestamp: new Date().toISOString(),
  };
}

function mergeMessages(current, incoming) {
  const merged = new Map();

  [...current, ...incoming].forEach((message) => {
    const key = typeof message.id === 'number' ? `db-${message.id}` : `tmp-${message.id}`;
    if (!merged.has(key)) {
      merged.set(key, message);
    }
  });

  return [...merged.values()].sort((left, right) => new Date(left.timestamp) - new Date(right.timestamp));
}

function parseConfirmationReply(value) {
  const normalized = value.trim().toLowerCase().replace(/[.!?]+$/g, '');
  if (YES_REPLIES.includes(normalized)) {
    return true;
  }
  if (NO_REPLIES.includes(normalized)) {
    return false;
  }
  return null;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionPending, setActionPending] = useState(false);
  const user = useAuthStore((state) => state.user);
  const member = useAuthStore((state) => state.member);
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: ['chat-history', member?.id],
    enabled: open && Boolean(member?.id),
    queryFn: async () => {
      const { data } = await api.get('/api/chat/history', { params: { member_id: member.id } });
      return data;
    },
  });

  useEffect(() => {
    if (historyQuery.data) {
      setMessages((current) => mergeMessages(current, historyQuery.data));
    }
  }, [historyQuery.data]);

  useEffect(() => {
    if (historyQuery.error) {
      toast.error(historyQuery.error.response?.data?.detail || 'Could not load chat history');
    }
  }, [historyQuery.error]);

  useEffect(() => {
    setMessages([]);
    setPendingAction(null);
    setDraft('');
  }, [member?.id]);

  const sendMutation = useMutation({
    mutationFn: async (content) => {
      const { data } = await api.post('/api/chat/message', {
        message: content,
        member_id: member.id,
      });
      return data;
    },
    onMutate: async (content) => {
      const optimisticMessage = {
        id: `temp-user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };
      setMessages((current) => [...current, optimisticMessage]);
      setDraft('');
      return { optimisticId: optimisticMessage.id };
    },
    onSuccess: (data, _content, context) => {
      setMessages((current) => [
        ...current.filter((message) => message.id !== context?.optimisticId),
        ...(data.messages?.length ? data.messages : [buildLocalMessage('assistant', data.reply)]),
      ]);
      setPendingAction(data.action ? { action: data.action, payload: data.action_payload } : null);
      if (member?.id) {
        queryClient.invalidateQueries({ queryKey: ['chat-history', member.id] });
      }
    },
    onError: (error, _content, context) => {
      setMessages((current) => current.filter((message) => message.id !== context?.optimisticId));
      toast.error(error.response?.data?.detail || 'The assistant is unavailable right now');
    },
  });

  const handleAction = async (confirmed, userReply = null) => {
    if (!pendingAction) {
      return;
    }

    if (userReply) {
      setMessages((current) => [...current, buildLocalMessage('user', userReply)]);
    }

    if (!confirmed) {
      setMessages((current) => [...current, buildLocalMessage('assistant', 'No problem. I left everything unchanged.')]);
      setPendingAction(null);
      return;
    }

    try {
      setActionPending(true);
      if (pendingAction.action === 'book_class') {
        await api.post('/api/bookings', {
          class_id: pendingAction.payload.class_id,
          scheduled_for: pendingAction.payload.scheduled_for,
          member_id: member.id,
        });
        setMessages((current) => [...current, buildLocalMessage('assistant', `Booked! You're in for ${pendingAction.payload.class_name}.`)]);
        toast.success('Class booked');
      } else if (pendingAction.action === 'cancel_booking') {
        await api.delete(`/api/bookings/${pendingAction.payload.booking_id}`);
        setMessages((current) => [...current, buildLocalMessage('assistant', `Done. I cancelled your ${pendingAction.payload.class_name} booking.`)]);
        toast.success('Booking cancelled');
      }
      setPendingAction(null);
      queryClient.invalidateQueries({ queryKey: ['chat-history', member.id] });
      queryClient.invalidateQueries({ queryKey: ['portal-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['portal-classes'] });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'That action could not be completed');
    } finally {
      setActionPending(false);
    }
  };

  const submitMessage = (content = draft) => {
    const value = content.trim();
    if (!value || sendMutation.isPending || actionPending || !member?.id) {
      return;
    }

    const confirmation = pendingAction ? parseConfirmationReply(value) : null;
    if (confirmation !== null) {
      setDraft('');
      void handleAction(confirmation, value);
      return;
    }

    if (pendingAction) {
      setPendingAction(null);
    }

    sendMutation.mutate(value);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 pointer-events-none">
      <div
        className={`mb-3 w-[22rem] max-w-[calc(100vw-2.5rem)] origin-bottom-right overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl transition duration-300 ${
          open ? 'pointer-events-auto translate-y-0 opacity-100' : '!pointer-events-none translate-y-6 opacity-0'
        }`}
      >
        <div className="border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-yellow-400 p-2 text-slate-950">
                <Bot size={18} />
              </div>
              <div>
                <p className="font-display text-lg font-bold">GymFlow AI</p>
                <p className="text-xs text-slate-400">
                  {member ? `Chatting as ${user?.name?.split(' ')[0]}` : 'Member login required for live actions'}
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1 text-slate-300 transition hover:bg-white/10">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="max-h-[24rem] min-h-[20rem] space-y-4 overflow-y-auto bg-slate-50 px-4 py-4 scrollbar-thin">
          {!member ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              Sign in as the seeded demo member to ask about schedules, book classes, and check payment info.
            </div>
          ) : null}

          {member && messages.length === 0 && !historyQuery.isLoading ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-600">
              Ask me about today's classes, your plan, or booking help. I'll use real GymFlow data.
            </div>
          ) : null}

          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-[1.5rem] px-4 py-3 text-sm shadow-sm ${
                  message.role === 'user' ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}

          {sendMutation.isPending ? (
            <div className="flex justify-start">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                type="button"
                disabled={!member}
                onClick={() => submitMessage(reply)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {reply}
              </button>
            ))}
          </div>

          {pendingAction ? (
            <div className="mb-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-yellow-800">
                <Sparkles size={16} />
                Pending action
              </div>
              <p className="mb-3 text-xs text-yellow-900">Reply with yes or no, or use the buttons below.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAction(true, 'Yes')}
                  disabled={actionPending}
                  className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(false, 'No')}
                  disabled={actionPending}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 disabled:opacity-60"
                >
                  No
                </button>
              </div>
            </div>
          ) : null}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitMessage();
            }}
            className="flex items-center gap-2 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-3 py-2"
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={member ? 'Ask GymFlow AI anything...' : 'Log in as a member to start chatting'}
              disabled={!member}
              className="w-full border-0 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!member || sendMutation.isPending || actionPending}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-accent text-slate-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SendHorizontal size={18} />
            </button>
          </form>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="pointer-events-auto ml-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent text-slate-950 shadow-2xl shadow-yellow-400/30 transition hover:scale-[1.02] hover:bg-yellow-300"
      >
        {open ? <X size={22} /> : <MessageCircleMore size={24} />}
      </button>
    </div>
  );
}
