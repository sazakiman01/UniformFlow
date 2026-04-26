"use client";

/* eslint-disable react/no-unescaped-entities */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, BookOpen, Users, Building2, FileText, Receipt, Wallet, BarChart3, Truck, FileMinus, ReceiptText, Wrench, Shield, UserCog, Eye, Edit3, Calculator } from "lucide-react";

export default function GuidePage() {
  const router = useRouter();
  const { user, loading, profile, profileLoading } = useAuth();

  useEffect(() => {
    if (loading || profileLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
  }, [user, loading, profileLoading, router]);

  if (loading || profileLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">คู่มือการใช้งาน</h1>
          </div>
          <p className="text-gray-600 text-lg">
            เรียนรู้วิธีใช้ระบบ UniformFlow ทีละขั้นตอน ง่ายๆ ไม่ต้องสอนงาน
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            เนื้อหาในคู่มือ
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <a href="#roles" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
              <Shield className="w-4 h-4" />
              ระบบ Role และสิทธิ์
            </a>
            <a href="#users" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
              <Users className="w-4 h-4" />
              จัดการผู้ใช้
            </a>
            <a href="#company" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
              <Building2 className="w-4 h-4" />
              ข้อมูลบริษัท
            </a>
            <a href="#finance-docs" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
              <FileText className="w-4 h-4" />
              เอกสารการเงิน
            </a>
            <a href="#delivery" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
              <Truck className="w-4 h-4" />
              ใบส่งของ
            </a>
            <a href="#expenses" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
              <Wallet className="w-4 h-4" />
              ค่าใช้จ่าย
            </a>
            <a href="#reports" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
              <BarChart3 className="w-4 h-4" />
              รายงาน
            </a>
            <a href="#tools" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
              <Wrench className="w-4 h-4" />
              เครื่องมือ
            </a>
          </div>
        </div>

        {/* Role System Section */}
        <section id="roles" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600" />
            ระบบ Role และสิทธิ์
          </h2>
          
          <p className="text-gray-700 mb-6">
            UniformFlow มี 4 Role หลัก เพื่อแบ่งหน้าที่การใช้งานอย่างชัดเจน
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Owner */}
            <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
              <div className="flex items-center gap-2 mb-3">
                <UserCog className="w-5 h-5 text-purple-700" />
                <h3 className="font-semibold text-purple-900">เจ้าของกิจการ (Owner)</h3>
              </div>
              <p className="text-sm text-purple-800 mb-2">
                ทำได้ทุกอย่างในระบบ
              </p>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• เชิญ/แก้ไขผู้ใช้</li>
                <li>• แก้ไขข้อมูลบริษัท</li>
                <li>• จัดการเอกสารทุกประเภท</li>
                <li>• เข้าถึงเครื่องมือทั้งหมด</li>
              </ul>
            </div>

            {/* Accountant */}
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-5 h-5 text-blue-700" />
                <h3 className="font-semibold text-blue-900">นักบัญชี (Accountant)</h3>
              </div>
              <p className="text-sm text-blue-800 mb-2">
                จัดการเอกสารการเงินทั้งหมด
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• สร้าง/แก้ไขเอกสารการเงิน</li>
                <li>• ดูรายงานการเงิน</li>
                <li>• จัดการใบส่งของ</li>
                <li>• บันทึกค่าใช้จ่าย</li>
              </ul>
            </div>

            {/* Staff */}
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <div className="flex items-center gap-2 mb-3">
                <UserCog className="w-5 h-5 text-green-700" />
                <h3 className="font-semibold text-green-900">พนักงาน (Staff)</h3>
              </div>
              <p className="text-sm text-green-800 mb-2">
                ดูแลเอกสารและข้อมูลการเงิน
              </p>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• สร้าง/แก้ไขใบส่งของ</li>
                <li>• ดูเอกสารการเงินทั้งหมด</li>
                <li>• ดูรายงาน</li>
                <li>• บันทึกค่าใช้จ่าย</li>
              </ul>
            </div>

            {/* Viewer */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5 text-gray-700" />
                <h3 className="font-semibold text-gray-900">ผู้ชม (Viewer)</h3>
              </div>
              <p className="text-sm text-gray-800 mb-2">
                ดูข้อมูลเท่านั้น ไม่สามารถแก้ไข
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• ดูเอกสารทั้งหมด</li>
                <li>• ดูรายงาน</li>
                <li>• ดูข้อมูลบริษัท</li>
                <li>• ไม่สามารถสร้าง/แก้ไข</li>
              </ul>
            </div>
          </div>

          {/* Permission Table */}
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ตารางสิทธิ์แต่ละหน้า</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 font-semibold text-gray-900">หน้า</th>
                  <th className="text-center p-3 font-semibold text-purple-900">Owner</th>
                  <th className="text-center p-3 font-semibold text-blue-900">Accountant</th>
                  <th className="text-center p-3 font-semibold text-green-900">Staff</th>
                  <th className="text-center p-3 font-semibold text-gray-900">Viewer</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3">ผู้ใช้</td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-purple-600" /> <Edit3 className="w-4 h-4 mx-auto text-purple-600" /></td>
                  <td className="text-center p-3">-</td>
                  <td className="text-center p-3">-</td>
                  <td className="text-center p-3">-</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">ข้อมูลบริษัท</td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-purple-600" /> <Edit3 className="w-4 h-4 mx-auto text-purple-600" /></td>
                  <td className="text-center p-3">-</td>
                  <td className="text-center p-3">-</td>
                  <td className="text-center p-3">-</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">ใบเสนอราคา</td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-purple-600" /> <Edit3 className="w-4 h-4 mx-auto text-purple-600" /></td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-blue-600" /> <Edit3 className="w-4 h-4 mx-auto text-blue-600" /></td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-green-600" /></td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-gray-600" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">ใบกำกับภาษี</td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-purple-600" /> <Edit3 className="w-4 h-4 mx-auto text-purple-600" /></td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-blue-600" /> <Edit3 className="w-4 h-4 mx-auto text-blue-600" /></td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-green-600" /></td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-gray-600" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">ใบเสร็จ</td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-purple-600" /> <Edit3 className="w-4 h-4 mx-auto text-purple-600" /></td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-blue-600" /> <Edit3 className="w-4 h-4 mx-auto text-blue-600" /></td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-green-600" /></td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-gray-600" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">ใบลดหนี้</td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-purple-600" /> <Edit3 className="w-4 h-4 mx-auto text-purple-600" /></td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-blue-600" /> <Edit3 className="w-4 h-4 mx-auto text-blue-600" /></td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-green-600" /></td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-gray-600" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">ใบวางบิล</td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-purple-600" /> <Edit3 className="w-4 h-4 mx-auto text-purple-600" /></td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-blue-600" /> <Edit3 className="w-4 h-4 mx-auto text-blue-600" /></td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-green-600" /></td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-gray-600" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">ใบส่งของ</td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-purple-600" /> <Edit3 className="w-4 h-4 mx-auto text-purple-600" /></td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-blue-600" /> <Edit3 className="w-4 h-4 mx-auto text-blue-600" /></td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-green-600" /> <Edit3 className="w-4 h-4 mx-auto text-green-600" /></td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-gray-600" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">ค่าใช้จ่าย</td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-purple-600" /> <Edit3 className="w-4 h-4 mx-auto text-purple-600" /></td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-blue-600" /> <Edit3 className="w-4 h-4 mx-auto text-blue-600" /></td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-green-600" /></td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-gray-600" /></td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">รายงาน</td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-purple-600" /></td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-blue-600" /></td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-green-600" /></td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-gray-600" /></td>
                </tr>
                <tr>
                  <td className="p-3">เครื่องมือ</td>
                  <td className="text-center p-3"><Eye className="w-4 h-4 mx-auto text-purple-600" /> <Edit3 className="w-4 h-4 mx-auto text-purple-600" /></td>
                  <td className="text-center p-3">-</td>
                  <td className="text-center p-3">-</td>
                  <td className="text-center p-3">-</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            <Eye className="w-3 h-3 inline mr-1" /> = ดูได้ | <Edit3 className="w-3 h-3 inline mr-1" /> = แก้ไขได้ | - = ไม่มีสิทธิ์
          </p>
        </section>

        {/* Users Section */}
        <section id="users" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            จัดการผู้ใช้ (Users)
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">เชิญพนักงานใหม่</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>ไปที่หน้า "ผู้ใช้" ในเมนูด้านซ้าย</li>
                <li>คลิกปุ่ม "เชิญผู้ใช้ใหม่"</li>
                <li>กรอกอีเมลของพนักงาน</li>
                <li>เลือก Role ที่ต้องการ (Owner, Accountant, Staff, Viewer)</li>
                <li>คลิก "ส่งคำเชิญ"</li>
                <li>พนักงานจะได้รับอีเมลเชิญ และกด link เพื่อตั้งรหัสผ่าน</li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">เปลี่ยน Role พนักงาน</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>ไปที่หน้า "ผู้ใช้"</li>
                <li>หาพนักงานที่ต้องการเปลี่ยน Role</li>
                <li>คลิก dropdown Role ที่แสดงอยู่</li>
                <li>เลือก Role ใหม่</li>
                <li>ระบบจะบันทึกอัตโนมัติ</li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">ปิดใช้งานบัญชี</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>ไปที่หน้า "ผู้ใช้"</li>
                <li>หาพนักงานที่ต้องการปิดใช้งาน</li>
                <li>คลิกปุ่ม "ปิดใช้งาน"</li>
                <li>ยืนยันการปิดใช้งาน</li>
                <li>บัญชีจะไม่สามารถ login ได้อีก</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Company Section */}
        <section id="company" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            ข้อมูลบริษัท (Company)
          </h2>
          
          <div className="space-y-4 text-gray-700">
            <p>
              หน้านี้ใช้แก้ไขข้อมูลบริษัทของคุณ ข้อมูลที่แก้ไขที่นี่จะปรากฏในเอกสารทั้งหมด
            </p>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">ข้อมูลที่แก้ไขได้</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>ชื่อบริษัท (ภาษาไทย/อังกฤษ)</li>
                <li>ที่อยู่บริษัท</li>
                <li>เลขนิติบุคคล / เลขประจำตัวผู้เสียภาษี</li>
                <li>เลขโทรศัพท์</li>
                <li>อีเมล</li>
                <li>โลโก้บริษัท (ถ้ามี)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">วิธีแก้ไข</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>ไปที่หน้า &quot;ข้อมูลบริษัท&quot;</li>
                <li>แก้ไขข้อมูลในช่องที่ต้องการ</li>
                <li>คลิก &quot;บันทึก&quot;</li>
                <li>ข้อมูลจะถูกอัปเดตทันที</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Finance Documents Section */}
        <section id="finance-docs" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            เอกสารการเงิน
          </h2>
          
          <p className="text-gray-700 mb-6">
            เอกสารการเงินประกอบด้วย: ใบเสนอราคา, ใบกำกับภาษี, ใบเสร็จ, ใบลดหนี้, ใบวางบิล
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">สร้างเอกสารใหม่</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>ไปที่หน้าเอกสารที่ต้องการ (เช่น ใบกำกับภาษี)</li>
                <li>คลิกปุ่ม &quot;ออกเอกสารใหม่&quot;</li>
                <li>เลือกลูกค้าจากรายการ (หรือสร้างลูกค้าใหม่)</li>
                <li>เพิ่มรายการสินค้า/บริการ</li>
                <li>กรอกจำนวน ราคาต่อหน่วย</li>
                <li>ระบบจะคำนวณยอดรวมอัตโนมัติ</li>
                <li>คลิก &quot;บันทึก&quot;</li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">แก้ไขเอกสาร</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>ไปที่หน้าเอกสารที่ต้องการ</li>
                <li>คลิกที่เอกสารที่ต้องการแก้ไข</li>
                <li>แก้ไขข้อมูลที่ต้องการ</li>
                <li>คลิก &quot;บันทึก&quot;</li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">พิมพ์เอกสาร</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>เปิดเอกสารที่ต้องการพิมพ์</li>
                <li>คลิกปุ่ม &quot;พิมพ์&rdquo;</li>
                <li>เลือกเครื่องพิมพ์</li>
                <li>คลิก &quot;พิมพ์&quot;</li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">ค้นหาเอกสาร</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>ไปที่หน้าเอกสารที่ต้องการ</li>
                <li>ใช้ช่องค้นหาด้านบน</li>
                <li>พิมพ์ชื่อลูกค้า, เลขเอกสาร หรือวันที่</li>
                <li>ระบบจะแสดงผลลัพธ์ที่ตรงกัน</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Delivery Notes Section */}
        <section id="delivery" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" />
            ใบส่งของ (Delivery Notes)
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">สร้างใบส่งของใหม่</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>ไปที่หน้า &quot;ใบส่งของ&rdquo;</li>
                <li>คลิกปุ่ม &quot;สร้างใหม่&quot;</li>
                <li>เลือกลูกค้า</li>
                <li>เพิ่มรายการสินค้าที่จะส่ง</li>
                <li>กรอกจำนวนที่ส่งจริง</li>
                <li>คลิก &quot;บันทึก&quot;</li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">แก้ไขใบส่งของ</h3>
              <p className="text-gray-700">
                ใช้วิธีเดียวกับเอกสารการเงิน — คลิกที่ใบส่งของ → แก้ไข → บันทึก
              </p>
            </div>
          </div>
        </section>

        {/* Expenses Section */}
        <section id="expenses" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-blue-600" />
            ค่าใช้จ่าย (Expenses)
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">บันทึกค่าใช้จ่ายใหม่</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>ไปที่หน้า &quot;ค่าใช้จ่าย&rdquo;</li>
                <li>คลิกปุ่ม &quot;บันทึกค่าใช้จ่าย&rdquo;</li>
                <li>เลือกหมวดหมู่ค่าใช้จ่าย</li>
                <li>กรอกยอดเงิน</li>
                <li>เพิ่มรายละเอียด (ถ้าจำเป็น)</li>
                <li>เลือกวันที่</li>
                <li>คลิก &quot;บันทึก&quot;</li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">แก้ไข/ลบค่าใช้จ่าย</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>ไปที่หน้า &quot;ค่าใช้จ่าย&rdquo;</li>
                <li>คลิกที่รายการที่ต้องการแก้ไข</li>
                <li>แก้ไขข้อมูล หรือคลิก &quot;ลบ&rdquo;</li>
                <li>ยืนยันการลบ (ถ้าเลือกลบ)</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Reports Section */}
        <section id="reports" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            รายงาน (Reports)
          </h2>
          
          <div className="space-y-4 text-gray-700">
            <p>
              หน้ารายงานแสดงสรุปยอดและข้อมูลสำคัญของธุรกิจของคุณ
            </p>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">รายงานที่มี</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>สรุปยอด</strong> — ยอดขายรวม, ยอดรับ, ยอดจ่าย</li>
                <li><strong>รายงานรายรับ-รายจ่าย</strong> — แยกตามเดือน/ปี</li>
                <li><strong>รายงานลูกค้า</strong> — ยอดซื้อรวมของแต่ละลูกค้า</li>
                <li><strong>รายงานสินค้า</strong> — ยอดขายแยกตามสินค้า</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">วิธีใช้</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>ไปที่หน้า "รายงาน"</li>
                <li>เลือกรายงานที่ต้องการดู</li>
                <li>เลือกช่วงเวลา (วันที่เริ่ม - วันที่สิ้นสุด)</li>
                <li>คลิก "แสดงผล"</li>
                <li>ดูข้อมูลในรูปแบบตารางหรือกราฟ</li>
                <li>สามารถ export เป็น PDF หรือ Excel ได้ (ถ้ามีฟีเจอร์)</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Tools Section */}
        <section id="tools" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-600" />
            เครื่องมือ (Tools)
          </h2>
          
          <div className="space-y-4 text-gray-700">
            <p className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <strong>หมายเหตุ:</strong> หน้านี้เข้าถึงได้เฉพาะ Owner เท่านั้น
            </p>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">เครื่องมือที่มี</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>ตั้งค่าระบบ</strong> — ตั้งค่าทั่วไปของระบบ</li>
                <li><strong>Backup ข้อมูล</strong> — สำรองข้อมูลทั้งหมด</li>
                <li><strong>Restore ข้อมูล</strong> — กู้คืนข้อมูลจาก backup</li>
                <li><strong>Logs</strong> — ดูประวัติการใช้งานระบบ</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">วิธีใช้</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>ไปที่หน้า "เครื่องมือ"</li>
                <li>เลือกเครื่องมือที่ต้องการใช้</li>
                <li>ทำตามคำแนะนำในแต่ละหน้า</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Tips Section */}
        <section className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-sm border border-blue-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            เทคนิคการใช้งาน
          </h2>
          
          <div className="space-y-4 text-gray-700">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">💡 เชิญพนักงานใหม่</h3>
              <p>
                เมื่อเชิญพนักงานใหม่ ให้เลือก Role ที่เหมาะสมกับหน้าที่งาน เช่น นักบัญชีเลือก Accountant, พนักงานขายเลือก Staff
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">💡 เปลี่ยน Role พนักงาน</h3>
              <p>
                ถ้าพนักงานเปลี่ยนหน้าที่งาน สามารถเปลี่ยน Role ได้ทันทีโดยไปที่หน้า "ผู้ใช้" แล้วเลือก Role ใหม่
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">💡 พิมพ์เอกสาร</h3>
              <p>
                ก่อนพิมพ์ ให้ตรวจสอบข้อมูลทั้งหมดให้ถูกต้อง หลังพิมพ์แล้วจะไม่สามารถแก้ไขได้ (เว้นแต่จะพิมพ์ใหม่)
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">💡 ค้นหาเอกสาร</h3>
              <p>
                ใช้ช่องค้นหาด้านบนเพื่อหาเอกสารเก่าๆ พิมพ์ชื่อลูกค้า, เลขเอกสาร หรือวันที่เพื่อค้นหาเร็วขึ้น
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">💡 ดูรายงาน</h3>
              <p>
                ดูรายงานสรุปยอดทุกเดือน เพื่อติดตามสุขภาพธุรกิจของคุณ รายงานช่วยให้เห็นภาพรวมของรายรับ-รายจ่าย
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>© 2026 UniformFlow — คู่มือนี้อัปเดตเมื่อ 26 เมษายน 2026</p>
          <p className="mt-2">
            <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
              กลับไปหน้า Admin
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
