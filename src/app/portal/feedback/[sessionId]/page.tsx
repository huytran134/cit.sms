"use client";

import React, { useActionState, useEffect, useState } from "react";
import { submitPublicFeedbackAction, fetchSessionForFeedbackAction } from "@/lib/actions/feedback";
import { 
  MessageSquare, User, 
  Phone, Send, CheckCircle2, 
  AlertCircle, Presentation,
  Copy, Check
} from "lucide-react";

interface FeedbackPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default function PublicFeedbackPage({ params }: FeedbackPageProps) {
  const resolvedParams = React.use(params);
  const sessionId = resolvedParams.sessionId;
  
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessionForFeedbackAction(sessionId).then((data) => {
      setSession(data);
      setLoading(false);
    });
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || session.status !== "COMPLETED") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-card p-8 rounded-3xl shadow-sm border border-border text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-black text-foreground">Không khả dụng</h1>
          <p className="text-sm text-muted-foreground font-medium">Buổi học không tồn tại hoặc chưa ở trạng thái hoàn thành để đánh giá.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background py-10 px-4 sm:px-6">
      <div className="max-w-md mx-auto">
        <FeedbackForm 
          sessionId={sessionId} 
          className={session.class.name} 
          sessionNum={session.sessionNumber} 
        />
      </div>
    </main>
  );
}

function FeedbackForm({ sessionId, className, sessionNum }: { sessionId: string, className: string, sessionNum: number }) {
  const [state, action, isPending] = useActionState(submitPublicFeedbackAction.bind(null, sessionId), null);
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    const feedbackUrl = `${window.location.origin}/portal/feedback/${sessionId}`;
    navigator.clipboard.writeText(feedbackUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (state?.success) {
    return (
      <div className="bg-card p-10 rounded-3xl shadow-xl shadow-green-600/5 border border-green-100 text-center space-y-6 animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-foreground">Gửi thành công!</h2>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed px-4">
            Cảm ơn bạn đã dành thời gian đánh giá buổi học. Những ý kiến này sẽ giúp CiT nâng cao chất lượng dạy và học.
          </p>
        </div>

        <div className="pt-4 space-y-4">
          <button
            onClick={copyLink}
            className="w-full flex items-center justify-center gap-2 py-3 bg-muted hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copied ? "Đã sao chép link!" : "📥 Copy link để gửi cho người khác"}
          </button>
          <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">CiT EDU System</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
          <Presentation className="w-3 h-3" />
          Phản hồi học tập
        </div>
        <h1 className="text-2xl font-black text-foreground tracking-tight">{className}</h1>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest italic">Buổi học số {sessionNum}</p>
      </div>

      {/* Form */}
      <form action={action} className="bg-card p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-border space-y-8">
        
        <p className="text-[10px] text-slate-400 font-medium italic text-center px-4 leading-relaxed">
          (Vui lòng điền đánh giá chất lượng buổi học của bạn. Nếu bạn truy cập trang này qua đường dẫn không chính xác, dữ liệu sẽ không được lưu.)
        </p>

        {/* Personal Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User className="w-3 h-3" />
              Họ và tên của bạn
            </label>
            <input 
              name="guestName"
              required
              placeholder="Nhập họ tên..."
              className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
            />
            {state?.errors?.guestName && <p className="text-[10px] font-bold text-red-500">{state.errors.guestName[0]}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Phone className="w-3 h-3" />
              Số điện thoại (Tùy chọn)
            </label>
            <input 
              name="guestPhone"
              placeholder="09xx xxx xxx"
              className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
            />
            {state?.errors?.guestPhone && <p className="text-[10px] font-bold text-red-500">{state.errors.guestPhone[0]}</p>}
          </div>
        </div>

        <div className="h-px bg-background mx-4" />

        {/* Ratings */}
        <div className="space-y-8">
          <RatingGroup name="lessonRating" label="Chất lượng nội dung bài giảng" error={state?.errors?.lessonRating?.[0]} />
          <RatingGroup name="teacherRating" label="Kỹ năng truyền đạt của Giảng viên" error={state?.errors?.teacherRating?.[0]} />
          <RatingGroup name="taRating" label="Sự hỗ trợ của Trợ giảng (TA)" error={state?.errors?.taRating?.[0]} />
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <MessageSquare className="w-3 h-3" />
            Góp ý thêm cho CiT
          </label>
          <textarea 
            name="comment"
            rows={3}
            placeholder="Bạn thấy buổi học thế nào? Điều gì cần cải thiện?"
            className="w-full px-4 py-3 bg-background border border-border rounded-2xl text-sm font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none"
          />
          {state?.errors?.comment && <p className="text-[10px] font-bold text-red-500">{state.errors.comment[0]}</p>}
        </div>

        {/* Action Message */}
        {state && !state.success && (
          <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-xs font-bold text-red-700">{state.message}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 group"
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Đang gửi...</span>
            </div>
          ) : (
            <>
              Gửi đánh giá ngay
              <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </>
          )}
        </button>
      </form>
      
      <div className="text-center px-8">
        <p className="text-[10px] text-slate-400 font-bold leading-relaxed italic">
          Mọi thông tin phản hồi của bạn đều được bảo mật và chỉ dùng để cải thiện dịch vụ.
        </p>
      </div>
    </div>
  );
}

function RatingGroup({ name, label, error }: { name: string, label: string, error?: string }) {
  const emojis = [
    { v: 1, e: "😞" },
    { v: 2, e: "😕" },
    { v: 3, e: "😐" },
    { v: 4, e: "🙂" },
    { v: 5, e: "😄" }
  ];

  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{label}</label>
        {error && <p className="text-[9px] font-bold text-red-500">{error}</p>}
      </div>
      <div className="flex justify-between gap-1">
        <input type="hidden" name={name} value={selected || ""} />
        {emojis.map((item) => (
          <button
            key={item.v}
            type="button"
            onClick={() => setSelected(item.v)}
            className={`
              flex-1 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all
              ${selected === item.v ? "bg-indigo-600 scale-110 shadow-lg shadow-indigo-200" : "bg-background hover:bg-muted"}
            `}
          >
            <span className={selected === item.v ? "grayscale-0" : "grayscale opacity-60"}>
              {item.e}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
