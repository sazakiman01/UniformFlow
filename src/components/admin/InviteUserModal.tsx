"use client";

import { useState, FormEvent } from "react";
import { collection, doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";
import {
  generateInviteToken,
  computeExpiresAt,
  buildInviteLink,
  INVITE_EXPIRY_DAYS,
} from "@/lib/invite";
import { X, Copy, CheckCircle2 } from "lucide-react";

interface InviteUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export default function InviteUserModal({
  open,
  onClose,
  onCreated,
}: InviteUserModalProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setEmail("");
    setRole("user");
    setError("");
    setCreatedLink(null);
    setCopied(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    setLoading(true);
    try {
      const token = generateInviteToken();
      const expiresAt = computeExpiresAt();
      const now = Timestamp.now();
      const ref = doc(collection(db, "invites"));
      await setDoc(ref, {
        email: email.trim().toLowerCase(),
        role,
        token,
        status: "pending",
        expiresAt: Timestamp.fromDate(expiresAt),
        createdBy: user.uid,
        createdAt: now,
      });
      setCreatedLink(buildInviteLink(token));
      onCreated?.();
    } catch (err: unknown) {
      console.error(err);
      setError("ไม่สามารถสร้างคำเชิญได้ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!createdLink) return;
    try {
      await navigator.clipboard.writeText(createdLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-2xl md:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="font-bold text-gray-900">
            {createdLink ? "สร้างคำเชิญสำเร็จ" : "เชิญผู้ใช้ใหม่"}
          </h3>
          <button
            onClick={handleClose}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-700"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!createdLink ? (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                อีเมล *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                บทบาท *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["user", "admin"] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`px-4 py-3 min-h-[48px] rounded-lg border-2 font-medium text-sm ${
                      role === r
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-600"
                    }`}
                  >
                    {r === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้งาน"}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-500">
              ลิงก์จะหมดอายุใน {INVITE_EXPIRY_DAYS} วัน
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "กำลังสร้าง..." : "สร้างลิงก์เชิญ"}
            </button>
          </form>
        ) : (
          <div className="p-4 space-y-4">
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium">สร้างคำเชิญเรียบร้อย</p>
                <p className="text-green-700">
                  คัดลอกลิงก์ด้านล่างแล้วส่งให้ผู้ใช้ผ่าน LINE
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ลิงก์เชิญ
              </label>
              <textarea
                readOnly
                value={createdLink}
                rows={3}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg font-mono break-all"
              />
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className={`w-full min-h-[48px] py-3 font-semibold rounded-lg inline-flex items-center justify-center gap-2 ${
                copied
                  ? "bg-green-600 text-white"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  คัดลอกแล้ว
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  คัดลอกลิงก์
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              หมดอายุใน {INVITE_EXPIRY_DAYS} วัน
            </p>

            <button
              type="button"
              onClick={handleClose}
              className="w-full min-h-[44px] py-2.5 text-gray-600 font-medium"
            >
              เสร็จสิ้น
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
