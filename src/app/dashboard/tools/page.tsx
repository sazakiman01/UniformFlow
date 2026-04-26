"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wrench, Upload, Wallet, Database, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const tools = [
  {
    href: "/dashboard/tools/import-customers",
    title: "Import ลูกค้าจาก CSV",
    desc: "อัปโหลด CSV จาก FlowAccount หรือ Excel → ระบบจะ map columns ให้อัตโนมัติ",
    icon: Upload,
    color: "text-blue-600 bg-blue-50",
  },
  {
    href: "/dashboard/tools/opening-balance",
    title: "ตั้งยอดยกมา (Opening Balance)",
    desc: "กำหนดเงินสด, ยอดบัญชีธนาคาร, ลูกหนี้คงค้างต้นงวด — ทำครั้งเดียวก่อนเริ่มใช้งาน",
    icon: Wallet,
    color: "text-green-600 bg-green-50",
  },
  {
    href: "/dashboard/company",
    title: "ข้อมูลบริษัท",
    desc: "TIN, ที่อยู่, PromptPay, บัญชีธนาคาร, รูปแบบเลขเอกสาร",
    icon: Database,
    color: "text-purple-600 bg-purple-50",
  },
];

export default function ToolsHub() {
  const { canManageUsers, profileLoading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!profileLoading && !canManageUsers) {
      router.replace("/dashboard");
    }
  }, [profileLoading, canManageUsers, router]);
  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-5">
        <Wrench className="w-6 h-6 text-gray-700" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">เครื่องมือ / Migration</h2>
          <p className="text-sm text-gray-600">ใช้ก่อนเริ่มใช้ระบบจริงและช่วงย้ายข้อมูลจาก FlowAccount</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900 mb-4">
        💡 <strong>ขั้นตอนย้ายจาก FlowAccount:</strong>
        <ol className="list-decimal list-inside text-xs mt-1 space-y-0.5">
          <li>ตั้งค่า ข้อมูลบริษัท (TIN, PromptPay, ธนาคาร)</li>
          <li>Export ลูกค้าจาก FA เป็น CSV → Import เข้าระบบ</li>
          <li>ตั้ง ยอดยกมา (เงินสด + ธนาคาร + ลูกหนี้คงค้าง ณ วันย้าย)</li>
          <li>เริ่มบันทึกเอกสารใหม่ในระบบนี้</li>
        </ol>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tools.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-400 hover:shadow-sm transition flex items-start gap-3"
          >
            <div className={`p-2.5 rounded-lg ${t.color}`}>
              <t.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{t.title}</h3>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" />
              </div>
              <p className="text-sm text-gray-600 mt-0.5">{t.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
