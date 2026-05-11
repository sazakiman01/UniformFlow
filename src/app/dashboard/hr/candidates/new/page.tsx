'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Position, Portfolio, InterviewRecord } from '@/types';
import { createCandidate } from '@/lib/candidates';
import { useAuth } from '@/contexts/AuthContext';

export default function NewCandidatePage() {
  const { profile, isOwner } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    position: 'Graphic Design' as Position,
    experienceYears: 0,
    expectedSalary: 0,
    status: 'New' as any,
    notes: '',
  });
  const [portfolioLinks, setPortfolioLinks] = useState<{ platform: string; url: string }[]>([
    { platform: '', url: '' },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setLoading(true);

      const portfolio: Portfolio = {
        files: [],
        externalLinks: portfolioLinks.filter((link) => link.platform && link.url),
      };

      await createCandidate({
        ...formData,
        portfolio,
        interviews: [],
        appliedDate: new Date(),
        createdBy: profile.id,
      });

      router.push('/dashboard/hr/candidates');
    } catch (error) {
      console.error('Error creating candidate:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'experienceYears' || name === 'expectedSalary' ? Number(value) : value,
    }));
  };

  const addPortfolioLink = () => {
    setPortfolioLinks([...portfolioLinks, { platform: '', url: '' }]);
  };

  const updatePortfolioLink = (index: number, field: 'platform' | 'url', value: string) => {
    const updated = [...portfolioLinks];
    updated[index][field] = value;
    setPortfolioLinks(updated);
  };

  const removePortfolioLink = (index: number) => {
    setPortfolioLinks(portfolioLinks.filter((_, i) => i !== index));
  };

  if (!isOwner) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">เพิ่มผู้สมัครใหม่</h1>
        <p className="text-gray-600 mt-1">กรอกข้อมูลผู้สมัครงาน</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Personal Information */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลส่วนตัว</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร *</label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่งที่สมัคร *</label>
              <select
                name="position"
                required
                value={formData.position}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Graphic Design">กราฟิกดีไซน์</option>
                <option value="Accounting">บัญชี</option>
                <option value="Sales">ขาย</option>
                <option value="Production">ช่างตัดผ้า</option>
                <option value="Manager">ผู้จัดการ</option>
                <option value="Admin">ฝ่ายปกครอง</option>
                <option value="Other">อื่นๆ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ประสบการณ์ (ปี)</label>
              <input
                type="number"
                name="experienceYears"
                min="0"
                value={formData.experienceYears}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เงินเดือนที่ต้องการ (บาท)</label>
              <input
                type="number"
                name="expectedSalary"
                min="0"
                value={formData.expectedSalary}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Portfolio Links */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio (ถ้ามี)</h2>
          {portfolioLinks.map((link, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              <div>
                <input
                  type="text"
                  placeholder="แพลตฟอร์ม (เช่น Behance, Dribbble)"
                  value={link.platform}
                  onChange={(e) => updatePortfolioLink(index, 'platform', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <input
                  type="url"
                  placeholder="URL"
                  value={link.url}
                  onChange={(e) => updatePortfolioLink(index, 'url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {portfolioLinks.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePortfolioLink(index)}
                  className="text-red-600 hover:text-red-900 text-sm"
                >
                  ลบ
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addPortfolioLink}
            className="text-blue-600 hover:text-blue-900 text-sm"
          >
            + เพิ่มลิงก์ Portfolio
          </button>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">โน้ต</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard/hr/candidates')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </form>
    </div>
  );
}
