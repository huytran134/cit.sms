"use client";

import React from "react";
import { Link as LinkIcon, Copy, Check } from "lucide-react";

export function CopyFeedbackButton({ sessionId, variant = "ghost" }: { sessionId: string, variant?: "ghost" | "button" }) {
  const [copied, setCopied] = React.useState(false);

  const copyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const feedbackUrl = `${window.location.origin}/portal/feedback/${sessionId}`;
    navigator.clipboard.writeText(feedbackUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (variant === "button") {
    return (
      <button
        onClick={copyLink}
        className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-slate-200 text-muted-foreground rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
      >
        {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
        {copied ? "Đã chép" : "Copy link gửi HV"}
      </button>
    );
  }

  return (
    <button
      onClick={copyLink}
      className="flex items-center gap-1.5 text-[10px] font-black text-blue-500 hover:text-blue-700 uppercase tracking-widest transition-colors"
      title="Sao chép link đánh giá"
    >
      {copied ? <Check className="w-3 h-3 text-green-600" /> : <LinkIcon className="w-3 h-3" />}
      {copied ? "Đã chép" : "Link đánh giá"}
    </button>
  );
}
