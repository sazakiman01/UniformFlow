'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Candidate, CANDIDATE_STATUS_LABELS, POSITION_LABELS, CandidateStatus, Position } from '@/types';
import { getAllCandidates, getCandidatesByStatus, getCandidatesByPosition, searchCandidates } from '@/lib/candidates';
import { useAuth } from '@/contexts/AuthContext';

export default function CandidatesListPage() {
  const { isOwner, loading: authLoading } = useAuth();
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | 'all'>('all');
  const [positionFilter, setPositionFilter] = useState<Position | 'all'>('all');

  useEffect(() => {
    if (!authLoading && !isOwner) {
      router.push('/dashboard');
      return;
    }

    loadCandidates();
  }, [isOwner, authLoading, router, statusFilter, positionFilter]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      let data: Candidate[] = [];

      if (statusFilter !== 'all') {
        data = await getCandidatesByStatus(statusFilter);
      } else if (positionFilter !== 'all') {
        data = await getCandidatesByPosition(positionFilter);
      } else {
        data = await getAllCandidates();
      }

      setCandidates(data);
    } catch (error) {
      console.error('Error loading candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      const results = await searchCandidates(term);
      setCandidates(results);
    } else {
      loadCandidates();
    }
  };

  const getStatusColor = (status: CandidateStatus): string => {
    const colors: Record<CandidateStatus, string> = {
      New: 'bg-blue-100 text-blue-800',
      Screening: 'bg-yellow-100 text-yellow-800',
      Interview: 'bg-purple-100 text-purple-800',
      Offer: 'bg-green-100 text-green-800',
      Hired: 'bg-emerald-100 text-emerald-800',
      Rejected: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">กำลังโหลด...</div>
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายการผู้สมัคร</h1>
          <p className="text-gray-600 mt-1">จัดการข้อมูลผู้สมัครงานทั้งหมด</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/hr/candidates/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          เพิ่มผู้สมัคร
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ค้นหา</label>
            <input
              type="text"
              placeholder="ชื่อ, เบอร์โทร, อีเมล"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CandidateStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value="New">ใหม่</option>
              <option value="Screening">คัดกรอง</option>
              <option value="Interview">สัมภาษณ์</option>
              <option value="Offer">เสนองาน</option>
              <option value="Hired">รับเข้างาน</option>
              <option value="Rejected">ไม่ผ่าน</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ตำแหน่ง</label>
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value as Position | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value="Graphic Design">กราฟิกดีไซน์</option>
              <option value="Accounting">บัญชี</option>
              <option value="Sales">ขาย</option>
              <option value="Production">ช่างตัดผ้า</option>
              <option value="Manager">ผู้จัดการ</option>
              <option value="Admin">ฝ่ายปกครอง</option>
              <option value="Other">อื่นๆ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ชื่อ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ตำแหน่ง
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                สถานะ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                วันที่สมัคร
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                เบอร์โทร
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {candidates.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  ไม่พบผู้สมัคร
                </td>
              </tr>
            ) : (
              candidates.map((candidate) => (
                <tr
                  key={candidate.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/dashboard/hr/candidates/${candidate.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                    <div className="text-sm text-gray-500">{candidate.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{POSITION_LABELS[candidate.position]}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(candidate.status)}`}>
                      {CANDIDATE_STATUS_LABELS[candidate.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(candidate.appliedDate).toLocaleDateString('th-TH')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {candidate.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/hr/candidates/${candidate.id}`);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      ดูรายละเอียด
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
