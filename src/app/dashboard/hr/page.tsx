'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Candidate, CANDIDATE_STATUS_LABELS, POSITION_LABELS, Position, CandidateStatus } from '@/types';
import { getCandidateStats, getAllCandidates } from '@/lib/candidates';
import { useAuth } from '@/contexts/AuthContext';

interface CandidateStats {
  total: number;
  byStatus: Record<CandidateStatus, number>;
  byPosition: Record<Position, number>;
}

export default function HRDashboardPage() {
  const { profile, isOwner, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<CandidateStats | null>(null);
  const [recentCandidates, setRecentCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isOwner) {
      router.push('/dashboard');
      return;
    }

    loadData();
  }, [isOwner, authLoading, router]);

  const loadData = async () => {
    try {
      const [statsData, candidatesData] = await Promise.all([
        getCandidateStats(),
        getAllCandidates(),
      ]);
      setStats(statsData);
      setRecentCandidates(candidatesData.slice(0, 5));
    } catch (error) {
      console.error('Error loading HR dashboard:', error);
    } finally {
      setLoading(false);
    }
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

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ภาพรวมการรับสมัครงาน</h1>
        <p className="text-gray-600 mt-1">ติดตามสถานะการรับสมัครงานทั้งหมด</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="ทั้งหมด" value={stats.total} color="blue" />
        <StatCard label="ใหม่" value={stats.byStatus.New} color="blue" />
        <StatCard label="คัดกรอง" value={stats.byStatus.Screening} color="yellow" />
        <StatCard label="สัมภาษณ์" value={stats.byStatus.Interview} color="purple" />
        <StatCard label="เสนองาน" value={stats.byStatus.Offer} color="green" />
        <StatCard label="รับเข้างาน" value={stats.byStatus.Hired} color="emerald" />
      </div>

      {/* Position Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">จำนวนผู้สมัครแต่ละตำแหน่ง</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats.byPosition).map(([position, count]) => (
            <div key={position} className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-600">{POSITION_LABELS[position as Position]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Candidates */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">ผู้สมัครล่าสุด</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentCandidates.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              ยังไม่มีผู้สมัคร
            </div>
          ) : (
            recentCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/dashboard/hr/candidates/${candidate.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{candidate.name}</div>
                    <div className="text-sm text-gray-600">
                      {POSITION_LABELS[candidate.position]} • {candidate.phone}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(candidate.status)}`}>
                    {CANDIDATE_STATUS_LABELS[candidate.status]}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    emerald: 'bg-emerald-500',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className={`text-3xl font-bold text-gray-900`}>{value}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    New: 'bg-blue-100 text-blue-800',
    Screening: 'bg-yellow-100 text-yellow-800',
    Interview: 'bg-purple-100 text-purple-800',
    Offer: 'bg-green-100 text-green-800',
    Hired: 'bg-emerald-100 text-emerald-800',
    Rejected: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
