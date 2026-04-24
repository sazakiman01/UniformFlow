"use client";

import { useEffect, useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
  Timestamp,
  limit,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { Invite } from "@/types";
import { effectiveStatus } from "@/lib/invite";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

function AcceptInviteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loadError, setLoadError] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setLoadError("ไม่พบ token ในลิงก์");
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, "invites"),
          where("token", "==", token),
          limit(1)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          setLoadError("ลิงก์เชิญไม่ถูกต้อง");
          setLoading(false);
          return;
        }
        const docSnap = snap.docs[0];
        const d = docSnap.data();
        const inv: Invite = {
          id: docSnap.id,
          email: d.email,
          role: d.role,
          token: d.token,
          status: d.status,
          expiresAt: (d.expiresAt as Timestamp).toDate(),
          createdBy: d.createdBy,
          createdAt: (d.createdAt as Timestamp).toDate(),
          acceptedAt: (d.acceptedAt as Timestamp)?.toDate?.(),
          acceptedBy: d.acceptedBy,
        };
        const status = effectiveStatus(inv);
        if (status === "accepted") {
          setLoadError("ลิงก์เชิญนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบ");
        } else if (status === "revoked") {
          setLoadError("ลิงก์เชิญนี้ถูกยกเลิกแล้ว");
        } else if (status === "expired") {
          setLoadError("ลิงก์เชิญหมดอายุ กรุณาติดต่อแอดมินเพื่อส่งใหม่");
        }
        setInvite(inv);
      } catch (err) {
        console.error(err);
        setLoadError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!invite) return;
    if (password.length < 6) {
      setSubmitError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    setSubmitting(true);
    try {
      // 1. Create Firebase Auth user
      const cred = await createUserWithEmailAndPassword(
        auth,
        invite.email,
        password
      );

      // 2. Batch: create user profile + mark invite accepted
      const batch = writeBatch(db);
      const now = Timestamp.now();
      batch.set(doc(db, "users", cred.user.uid), {
        email: invite.email,
        role: invite.role,
        disabled: false,
        invitedBy: invite.createdBy,
        createdAt: now,
        updatedAt: now,
      });
      batch.update(doc(db, "invites", invite.id), {
        status: "accepted",
        acceptedAt: now,
        acceptedBy: cred.user.uid,
      });
      await batch.commit();

      // Ensure session active
      await signInWithEmailAndPassword(auth, invite.email, password);
      router.push("/mobile/orders");
    } catch (err: unknown) {
      console.error(err);
      const code = (err as { code?: string })?.code;
      setSubmitError(
        code === "auth/email-already-in-use"
          ? "อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ"
          : code === "auth/weak-password"
          ? "รหัสผ่านอ่อนเกินไป"
          : "เกิดข้อผิดพลาด กรุณาลองใหม่"
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <CardShell>
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p>กำลังตรวจสอบลิงก์...</p>
        </div>
      </CardShell>
    );
  }

  if (loadError) {
    return (
      <CardShell>
        <div className="flex flex-col items-center text-center py-6">
          <AlertCircle className="w-14 h-14 text-orange-500 mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            ไม่สามารถใช้ลิงก์นี้ได้
          </h2>
          <p className="text-gray-600 mb-6 text-sm">{loadError}</p>
          <Link
            href="/login"
            className="w-full min-h-[48px] py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 text-center"
          >
            ไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </CardShell>
    );
  }

  if (!invite) return null;

  return (
    <CardShell>
      <div className="text-center mb-6">
        <CheckCircle2 className="w-12 h-12 text-blue-600 mx-auto mb-2" />
        <h2 className="text-xl font-bold text-gray-900">
          ยินดีต้อนรับสู่ UniformFlow
        </h2>
        <p className="text-gray-600 text-sm mt-1">ตั้งรหัสผ่านเพื่อเริ่มใช้งาน</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            อีเมล
          </label>
          <input
            type="email"
            value={invite.email}
            readOnly
            className="w-full px-4 py-3 min-h-[48px] bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            บทบาท
          </label>
          <div className="w-full px-4 py-3 min-h-[48px] bg-blue-50 border border-blue-200 rounded-lg text-blue-900 font-medium">
            {invite.role === "admin" ? "ผู้ดูแลระบบ (Admin)" : "ผู้ใช้งาน (User)"}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            รหัสผ่าน *
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="อย่างน้อย 6 ตัว"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ยืนยันรหัสผ่าน *
          </label>
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="กรอกซ้ำ"
          />
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-[52px] py-3.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "กำลังสร้างบัญชี..." : "สร้างบัญชีและเข้าสู่ระบบ"}
        </button>
      </form>
    </CardShell>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 md:p-8">
        {children}
      </div>
    </main>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <CardShell>
          <div className="flex flex-col items-center py-8 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </CardShell>
      }
    >
      <AcceptInviteInner />
    </Suspense>
  );
}
