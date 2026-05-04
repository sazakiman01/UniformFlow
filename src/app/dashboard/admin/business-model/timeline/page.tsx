'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BusinessModelCanvas } from '@/types';
import { getBusinessModelCanvases } from '@/lib/business-model-canvas';
import { normalizeToMonthly, formatTHB } from '@/lib/bmc-utils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  ArrowLeft, ArrowRight, Calendar, Users, DollarSign, Handshake,
  TrendingUp, GitCompare, Pencil,
} from 'lucide-react';

export default function BusinessModelCanvasTimelinePage() {
  const router = useRouter();
  const [canvases, setCanvases] = useState<BusinessModelCanvas[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCanvas, setSelectedCanvas] = useState<BusinessModelCanvas | null>(null);
  const [compareCanvas, setCompareCanvas] = useState<BusinessModelCanvas | null>(null);

  useEffect(() => {
    loadCanvases();
  }, []);

  const loadCanvases = async () => {
    try {
      const data = await getBusinessModelCanvases();
      setCanvases(data);
      if (data.length > 0) setSelectedCanvas(data[0]);
    } catch (error) {
      console.error('Error loading canvases:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQuarterOrder = (q: string) => ({ Q1: 1, Q2: 2, Q3: 3, Q4: 4 } as Record<string, number>)[q] || 0;

  const computeMonthly = (c: BusinessModelCanvas) => {
    const revenue = c.revenueStreams.reduce((s, r) => s + normalizeToMonthly(r.estimatedRevenue || 0, r.period), 0);
    const cost = c.costStructure.reduce((s, x) => s + normalizeToMonthly(x.estimatedCost || 0, x.period), 0);
    return { revenue, cost, profit: revenue - cost };
  };

  // Sort chronologically (oldest → newest) for timeline + chart
  const sortedAsc = useMemo(() => {
    return [...canvases].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      if (a.quarter !== b.quarter) return getQuarterOrder(a.quarter) - getQuarterOrder(b.quarter);
      return a.version - b.version;
    });
  }, [canvases]);

  const trendData = useMemo(() => sortedAsc.map((c) => {
    const m = computeMonthly(c);
    return {
      label: `${c.year} ${c.quarter}·v${c.version}`,
      revenue: Math.round(m.revenue),
      cost: Math.round(m.cost),
      profit: Math.round(m.profit),
    };
  }), [sortedAsc]);

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  // Newest → oldest for timeline display
  const sortedDesc = [...sortedAsc].reverse();

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> กลับ
          </button>
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Strategy History</div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Timeline</h1>
          <p className="text-slate-600 mt-1">ติดตามวิวัฒนาการของโมเดลธุรกิจ ข้ามเวอร์ชันและไตรมาส</p>
        </div>
      </div>

      {canvases.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl py-16 px-6 text-center">
          <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-700 font-medium mb-1">ยังไม่มี Business Model Canvas</p>
          <button
            onClick={() => router.push('/dashboard/admin/business-model')}
            className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            ไปสร้างเวอร์ชันแรก
          </button>
        </div>
      ) : (
        <>
          {/* Compare Section */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <GitCompare className="w-5 h-5 text-indigo-500" />
              <h2 className="text-base font-semibold text-slate-900">เปรียบเทียบเวอร์ชัน</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto] gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">เวอร์ชัน A</label>
                <select
                  value={selectedCanvas?.id || ''}
                  onChange={(e) => setSelectedCanvas(canvases.find((c) => c.id === e.target.value) || null)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {canvases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.year} {c.quarter} · v{c.version}
                    </option>
                  ))}
                </select>
              </div>
              <ArrowRight className="hidden md:block w-5 h-5 text-slate-400 mb-2.5" />
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">เวอร์ชัน B</label>
                <select
                  value={compareCanvas?.id || ''}
                  onChange={(e) => setCompareCanvas(canvases.find((c) => c.id === e.target.value) || null)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">— เลือกเวอร์ชัน —</option>
                  {canvases.filter((c) => c.id !== selectedCanvas?.id).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.year} {c.quarter} · v{c.version}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {
                  if (selectedCanvas && compareCanvas) {
                    router.push(`/dashboard/admin/business-model/compare?from=${selectedCanvas.id}&to=${compareCanvas.id}`);
                  }
                }}
                disabled={!selectedCanvas || !compareCanvas}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold"
              >
                เปรียบเทียบ
              </button>
            </div>
          </div>

          {/* Trend Chart */}
          {trendData.length >= 2 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <div>
                  <h2 className="text-base font-semibold text-slate-900">แนวโน้มทางการเงิน</h2>
                  <p className="text-xs text-slate-500">Revenue · Cost · Profit · ทุกค่า normalize เป็นรายเดือน</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatTHB(Number(v), { compact: true })} />
                  <Tooltip formatter={(v) => `${formatTHB(Number(v))} บาท`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="revenue" name="รายได้" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="cost" name="ต้นทุน" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="profit" name="กำไร" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Vertical Timeline */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-5 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              ไทม์ไลน์เวอร์ชัน
            </h2>
            <div className="relative pl-6">
              {/* Vertical line */}
              <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-200 via-slate-200 to-transparent" />

              <div className="space-y-5">
                {sortedDesc.map((c, idx) => {
                  const prev = sortedDesc[idx + 1]; // chronologically previous
                  const m = computeMonthly(c);
                  const prevM = prev ? computeMonthly(prev) : null;
                  const revDiff = prevM ? m.revenue - prevM.revenue : 0;
                  const segmentDiff = prev ? c.customerSegments.length - prev.customerSegments.length : 0;
                  return (
                    <div key={c.id} className="relative">
                      {/* Dot */}
                      <div className="absolute -left-[18px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-indigo-500 shadow-sm flex items-center justify-center">
                        {idx === 0 && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                      </div>

                      <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-4 hover:shadow-sm transition">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-bold text-slate-900">{c.year} · {c.quarter}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-medium">v{c.version}</span>
                              {idx === 0 && <span className="text-xs px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-medium">ปัจจุบัน</span>}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {c.updatedAt ? new Date(c.updatedAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                            </div>
                          </div>
                          <button
                            onClick={() => router.push(`/dashboard/admin/business-model/${c.id}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:border-slate-300 hover:shadow-sm transition"
                          >
                            <Pencil className="w-3 h-3" /> แก้ไข
                          </button>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                          <Stat icon={<DollarSign className="w-3.5 h-3.5" />} label="รายได้/เดือน" value={`${formatTHB(m.revenue)}`} unit="บาท" tone="emerald" diff={prev ? revDiff : undefined} />
                          <Stat icon={<TrendingUp className="w-3.5 h-3.5" />} label="กำไร/เดือน" value={`${formatTHB(m.profit)}`} unit="บาท" tone={m.profit >= 0 ? 'indigo' : 'rose'} />
                          <Stat icon={<Users className="w-3.5 h-3.5" />} label="Segments" value={String(c.customerSegments.length)} tone="blue" diff={prev ? segmentDiff : undefined} diffMode="count" />
                          <Stat icon={<Handshake className="w-3.5 h-3.5" />} label="Partners" value={String(c.keyPartnerships.length)} tone="purple" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  icon, label, value, unit, tone, diff, diffMode = 'money',
}: {
  icon: React.ReactNode; label: string; value: string; unit?: string;
  tone: 'emerald' | 'rose' | 'indigo' | 'blue' | 'purple';
  diff?: number; diffMode?: 'money' | 'count';
}) {
  const palette: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-700',
    rose: 'bg-rose-100 text-rose-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
  };
  const showDiff = diff !== undefined && diff !== 0;
  const diffColor = (diff || 0) > 0 ? 'text-emerald-600' : 'text-rose-600';
  const diffPrefix = (diff || 0) > 0 ? '+' : '';
  const diffText = diffMode === 'money' ? `${diffPrefix}${formatTHB(diff || 0, { compact: true })}` : `${diffPrefix}${diff}`;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <div className={`w-5 h-5 rounded ${palette[tone]} flex items-center justify-center`}>{icon}</div>
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</span>
      </div>
      <div className="text-sm font-bold text-slate-900">
        {value} {unit && <span className="text-xs font-normal text-slate-500">{unit}</span>}
      </div>
      {showDiff && (
        <div className={`text-[10px] font-semibold ${diffColor} mt-0.5`}>{diffText}</div>
      )}
    </div>
  );
}
