'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Candidate, CANDIDATE_STATUS_LABELS, POSITION_LABELS, CandidateStatus, InterviewRecord } from '@/types';
import { getCandidateById, updateCandidate, deleteCandidate } from '@/lib/candidates';
import { useAuth } from '@/contexts/AuthContext';

export default function CandidateDetailPage() {
  const { profile, isOwner } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'portfolio' | 'interviews' | 'history' | 'notes'>('info');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [newInterview, setNewInterview] = useState({ interviewer: '', score: 5, feedback: '' });
  const [editFormData, setEditFormData] = useState<Partial<Candidate>>({});

  useEffect(() => {
    loadCandidate();
  }, [params.id]);

  const loadCandidate = async () => {
    try {
      const id = params.id as string;
      const data = await getCandidateById(id);
      setCandidate(data);
      setEditFormData(data || {});
    } catch (error) {
      console.error('Error loading candidate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: CandidateStatus) => {
    if (!candidate || !profile) return;

    try {
      await updateCandidate(candidate.id, { status: newStatus }, profile.id);
      loadCandidate();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  const handleDelete = async () => {
    if (!candidate || !confirm('ต้องการลบผู้สมัครนี้ใช่ไหม?')) return;

    try {
      await deleteCandidate(candidate.id);
      router.push('/dashboard/hr/candidates');
    } catch (error) {
      console.error('Error deleting candidate:', error);
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const handleAddInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate || !profile) return;

    try {
      const interview: InterviewRecord = {
        date: new Date(),
        interviewer: newInterview.interviewer,
        score: newInterview.score,
        feedback: newInterview.feedback,
      };

      await updateCandidate(
        candidate.id,
        {
          interviews: [...candidate.interviews, interview],
        },
        profile.id
      );

      setNewInterview({ interviewer: '', score: 5, feedback: '' });
      setShowInterviewModal(false);
      loadCandidate();
    } catch (error) {
      console.error('Error adding interview:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกการสัมภาษณ์');
    }
  };

  const handleUpdateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate || !profile) return;

    try {
      await updateCandidate(candidate.id, editFormData, profile.id);
      setShowEditModal(false);
      loadCandidate();
    } catch (error) {
      console.error('Error updating candidate:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">กำลังโหลด...</div>
      </div>
    );
  }

  if (!candidate || !isOwner) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{candidate.name}</h1>
            <div className="text-gray-600 mt-1">
              {POSITION_LABELS[candidate.position]} • {candidate.phone} • {candidate.email}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={candidate.status}
              onChange={(e) => handleStatusChange(e.target.value as CandidateStatus)}
              className={`px-3 py-1 rounded-lg font-medium ${getStatusColor(candidate.status)}`}
            >
              <option value="New">ใหม่</option>
              <option value="Screening">คัดกรอง</option>
              <option value="Interview">สัมภาษณ์</option>
              <option value="Offer">เสนองาน</option>
              <option value="Hired">รับเข้างาน</option>
              <option value="Rejected">ไม่ผ่าน</option>
            </select>
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              แก้ไข
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              ลบ
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'info'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              ข้อมูลส่วนตัว
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'portfolio'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Portfolio
            </button>
            <button
              onClick={() => setActiveTab('interviews')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'interviews'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              การสัมภาษณ์
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              ประวัติสถานะ
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              โน้ต
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">ชื่อ-นามสกุล</label>
                  <div className="mt-1 text-gray-900">{candidate.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">เบอร์โทร</label>
                  <div className="mt-1 text-gray-900">{candidate.phone}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">อีเมล</label>
                  <div className="mt-1 text-gray-900">{candidate.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">ตำแหน่ง</label>
                  <div className="mt-1 text-gray-900">{POSITION_LABELS[candidate.position]}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">ประสบการณ์</label>
                  <div className="mt-1 text-gray-900">{candidate.experienceYears} ปี</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">เงินเดือนที่ต้องการ</label>
                  <div className="mt-1 text-gray-900">{candidate.expectedSalary.toLocaleString()} บาท</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">วันที่สมัคร</label>
                  <div className="mt-1 text-gray-900">
                    {new Date(candidate.appliedDate).toLocaleDateString('th-TH')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="space-y-4">
              {candidate.portfolio.externalLinks.length > 0 ? (
                <div className="space-y-2">
                  {candidate.portfolio.externalLinks.map((link, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{link.platform}</div>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          {link.url}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">ไม่มี Portfolio</div>
              )}
            </div>
          )}

          {activeTab === 'interviews' && (
            <div className="space-y-4">
              <button
                onClick={() => setShowInterviewModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + เพิ่มการสัมภาษณ์
              </button>

              {candidate.interviews.length > 0 ? (
                <div className="space-y-4">
                  {candidate.interviews.map((interview, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">{interview.interviewer}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(interview.date).toLocaleDateString('th-TH')}
                        </div>
                      </div>
                      <div className="mb-2">
                        <span className="text-sm text-gray-500">คะแนน:</span>{' '}
                        <span className="font-medium">{interview.score}/10</span>
                      </div>
                      <div className="text-gray-700">{interview.feedback}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">ยังไม่มีการสัมภาษณ์</div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {candidate.statusHistory.length > 0 ? (
                <div className="space-y-2">
                  {candidate.statusHistory.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(entry.status)}`}>
                          {CANDIDATE_STATUS_LABELS[entry.status]}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(entry.changedAt).toLocaleString('th-TH')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">ไม่มีประวัติการเปลี่ยนสถานะ</div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <div className="text-gray-900 whitespace-pre-wrap">{candidate.notes || 'ไม่มีโน้ต'}</div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">แก้ไขข้อมูลผู้สมัคร</h2>
              <form onSubmit={handleUpdateCandidate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
                  <input
                    type="tel"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                  <input
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">โน้ต</label>
                  <textarea
                    value={editFormData.notes || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    บันทึก
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Interview Modal */}
      {showInterviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">เพิ่มการสัมภาษณ์</h2>
              <form onSubmit={handleAddInterview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ผู้สัมภาษณ์</label>
                  <input
                    type="text"
                    required
                    value={newInterview.interviewer}
                    onChange={(e) => setNewInterview({ ...newInterview, interviewer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">คะแนน (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={newInterview.score}
                    onChange={(e) => setNewInterview({ ...newInterview, score: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                  <textarea
                    required
                    value={newInterview.feedback}
                    onChange={(e) => setNewInterview({ ...newInterview, feedback: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowInterviewModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    บันทึก
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
