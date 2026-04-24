"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Invite, UserProfile, UserRole } from "@/types";
import {
  buildInviteLink,
  computeExpiresAt,
  effectiveStatus,
  formatTimeRemaining,
  generateInviteToken,
} from "@/lib/invite";
import { formatDate } from "@/lib/utils";
import InviteUserModal from "@/components/admin/InviteUserModal";
import {
  Plus,
  Copy,
  RefreshCw,
  XCircle,
  Shield,
  User as UserIcon,
  Lock,
  Unlock,
  Trash2,
  Check,
} from "lucide-react";

type Tab = "users" | "invites";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const unsubUsers = onSnapshot(
      query(collection(db, "users"), orderBy("createdAt", "desc")),
      (snap) => {
        setUsers(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              email: data.email,
              displayName: data.displayName,
              role: data.role ?? "user",
              disabled: data.disabled ?? false,
              lineUserId: data.lineUserId,
              invitedBy: data.invitedBy,
              createdAt: (data.createdAt as Timestamp)?.toDate?.() ?? new Date(),
              updatedAt: (data.updatedAt as Timestamp)?.toDate?.() ?? new Date(),
            } as UserProfile;
          })
        );
      }
    );

    const unsubInvites = onSnapshot(
      query(collection(db, "invites"), orderBy("createdAt", "desc")),
      (snap) => {
        setInvites(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              email: data.email,
              role: data.role,
              token: data.token,
              status: data.status,
              expiresAt: (data.expiresAt as Timestamp).toDate(),
              createdBy: data.createdBy,
              createdAt: (data.createdAt as Timestamp).toDate(),
              acceptedAt: (data.acceptedAt as Timestamp)?.toDate?.(),
              acceptedBy: data.acceptedBy,
            } as Invite;
          })
        );
        setLoading(false);
      }
    );

    return () => {
      unsubUsers();
      unsubInvites();
    };
  }, []);

  const pendingInvites = invites.filter((inv) => {
    const s = effectiveStatus(inv);
    return s === "pending" || s === "expired";
  });

  const handleChangeRole = async (u: UserProfile) => {
    if (u.id === currentUser?.uid) {
      alert("ไม่สามารถเปลี่ยนบทบาทของตัวเองได้");
      return;
    }
    const newRole: UserRole = u.role === "admin" ? "user" : "admin";
    const msg =
      newRole === "admin"
        ? `ยืนยันเปลี่ยน ${u.email} เป็น Admin?`
        : `ยืนยันเปลี่ยน ${u.email} เป็น User?`;
    if (!confirm(msg)) return;
    try {
      await updateDoc(doc(db, "users", u.id), {
        role: newRole,
        updatedAt: Timestamp.now(),
      });
    } catch (e) {
      console.error(e);
      alert("ไม่สามารถอัปเดตได้");
    }
  };

  const handleToggleDisable = async (u: UserProfile) => {
    if (u.id === currentUser?.uid) {
      alert("ไม่สามารถปิดบัญชีตัวเองได้");
      return;
    }
    const next = !u.disabled;
    if (!confirm(`ยืนยัน${next ? "ปิด" : "เปิด"}ใช้งานบัญชี ${u.email}?`)) return;
    try {
      await updateDoc(doc(db, "users", u.id), {
        disabled: next,
        updatedAt: Timestamp.now(),
      });
    } catch (e) {
      console.error(e);
      alert("ไม่สามารถอัปเดตได้");
    }
  };

  const handleDeleteUser = async (u: UserProfile) => {
    if (u.id === currentUser?.uid) {
      alert("ไม่สามารถลบบัญชีตัวเองได้");
      return;
    }
    if (
      !confirm(
        `ลบ ${u.email}?\n\nหมายเหตุ: จะลบเฉพาะ profile ใน Firestore เท่านั้น ต้องลบ Firebase Auth user ผ่าน Console แยก`
      )
    )
      return;
    try {
      await deleteDoc(doc(db, "users", u.id));
    } catch (e) {
      console.error(e);
      alert("ไม่สามารถลบได้");
    }
  };

  const handleCopyInvite = async (inv: Invite) => {
    try {
      await navigator.clipboard.writeText(buildInviteLink(inv.token));
      setCopiedId(inv.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResendInvite = async (inv: Invite) => {
    if (!confirm(`ส่งคำเชิญใหม่ให้ ${inv.email}? (ลิงก์เก่าจะใช้ไม่ได้)`))
      return;
    try {
      await updateDoc(doc(db, "invites", inv.id), {
        token: generateInviteToken(),
        expiresAt: Timestamp.fromDate(computeExpiresAt()),
        status: "pending",
      });
      alert("สร้างลิงก์ใหม่แล้ว กดปุ่มคัดลอกเพื่อส่งต่อ");
    } catch (e) {
      console.error(e);
      alert("ไม่สามารถส่งใหม่ได้");
    }
  };

  const handleRevokeInvite = async (inv: Invite) => {
    if (!confirm(`ยกเลิกคำเชิญ ${inv.email}?`)) return;
    try {
      await updateDoc(doc(db, "invites", inv.id), { status: "revoked" });
    } catch (e) {
      console.error(e);
      alert("ไม่สามารถยกเลิกได้");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <InviteUserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">จัดการผู้ใช้</h2>
          <p className="text-sm text-gray-500">
            {users.length} ผู้ใช้ · {pendingInvites.length} คำเชิญรอ
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1 px-3 py-2 min-h-[44px] bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          เชิญใหม่
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm">
        <button
          onClick={() => setTab("users")}
          className={`flex-1 min-h-[44px] py-2 rounded-md text-sm font-medium ${
            tab === "users"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          ผู้ใช้ ({users.length})
        </button>
        <button
          onClick={() => setTab("invites")}
          className={`flex-1 min-h-[44px] py-2 rounded-md text-sm font-medium ${
            tab === "invites"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          คำเชิญ ({pendingInvites.length})
        </button>
      </div>

      {loading && (
        <div className="text-center py-10 text-gray-500">กำลังโหลด...</div>
      )}

      {!loading && tab === "users" && (
        <div className="space-y-3">
          {users.length === 0 && (
            <div className="bg-white rounded-xl p-6 text-center text-gray-500">
              ยังไม่มีผู้ใช้
            </div>
          )}
          {users.map((u) => {
            const isSelf = u.id === currentUser?.uid;
            return (
              <div
                key={u.id}
                className="bg-white rounded-xl p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 truncate">
                        {u.email}
                      </p>
                      {isSelf && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          คุณ
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {u.role === "admin" ? (
                          <Shield className="w-3 h-3" />
                        ) : (
                          <UserIcon className="w-3 h-3" />
                        )}
                        {u.role === "admin" ? "Admin" : "User"}
                      </span>
                      {u.disabled && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">
                          <Lock className="w-3 h-3" />
                          ปิดใช้งาน
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        เข้าร่วม {formatDate(u.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
                  <button
                    onClick={() => handleChangeRole(u)}
                    disabled={isSelf}
                    className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[36px] text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-40"
                  >
                    {u.role === "admin" ? <UserIcon className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                    เปลี่ยนเป็น {u.role === "admin" ? "User" : "Admin"}
                  </button>
                  <button
                    onClick={() => handleToggleDisable(u)}
                    disabled={isSelf}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 min-h-[36px] text-xs font-medium rounded-md disabled:opacity-40 ${
                      u.disabled
                        ? "text-green-700 bg-green-50 hover:bg-green-100"
                        : "text-orange-700 bg-orange-50 hover:bg-orange-100"
                    }`}
                  >
                    {u.disabled ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        เปิดใช้งาน
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        ปิดใช้งาน
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u)}
                    disabled={isSelf}
                    className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[36px] text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    ลบ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && tab === "invites" && (
        <div className="space-y-3">
          {pendingInvites.length === 0 && (
            <div className="bg-white rounded-xl p-6 text-center text-gray-500">
              ไม่มีคำเชิญที่รออยู่
            </div>
          )}
          {pendingInvites.map((inv) => {
            const status = effectiveStatus(inv);
            const isExpired = status === "expired";
            return (
              <div
                key={inv.id}
                className="bg-white rounded-xl p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">
                      {inv.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                          inv.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {inv.role === "admin" ? "Admin" : "User"}
                      </span>
                      {isExpired ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">
                          หมดอายุ
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">
                          {formatTimeRemaining(inv.expiresAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
                  <button
                    onClick={() => handleCopyInvite(inv)}
                    disabled={isExpired}
                    className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[36px] text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-40"
                  >
                    {copiedId === inv.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        คัดลอกแล้ว
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        คัดลอกลิงก์
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleResendInvite(inv)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[36px] text-xs font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    ส่งใหม่
                  </button>
                  <button
                    onClick={() => handleRevokeInvite(inv)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 min-h-[36px] text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    ยกเลิก
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
