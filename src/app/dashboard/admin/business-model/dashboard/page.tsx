'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BusinessModelCanvas } from '@/types';
import { getBusinessModelCanvases } from '@/lib/business-model-canvas';
import { normalizeToMonthly, formatTHB, PERIOD_LABELS } from '@/lib/bmc-utils';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  ArrowLeft, DollarSign, Receipt, TrendingUp, TrendingDown, Users, Handshake,
  Lightbulb, Target,
} from 'lucide-react';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function BusinessModelCanvasDashboardPage() {
  const router = useRouter();
  const [canvases, setCanvases] = useState<BusinessModelCanvas[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCanvas, setSelectedCanvas] = useState<BusinessModelCanvas | null>(null);

  useEffect(() => {
    loadCanvases();
  }, []);

  const loadCanvases = async () => {
    try {
      const data = await getBusinessModelCanvases();
      setCanvases(data);
      if (data.length > 0) {
        setSelectedCanvas(data[0]);
      }
    } catch (error) {
      console.error('Error loading canvases:', error);
    } finally {
      setLoading(false);
    }
  };

  const data = useMemo(() => {
    if (!selectedCanvas) return null;
    const revenueItems = selectedCanvas.revenueStreams.map((r) => ({
      name: r.name || '(ไม่ระบุ)',
      monthly: normalizeToMonthly(r.estimatedRevenue || 0, r.period),
      raw: r.estimatedRevenue || 0,
      period: r.period || 'month',
    }));
    const costItems = selectedCanvas.costStructure.map((c) => ({
      name: c.name || '(ไม่ระบุ)',
      monthly: normalizeToMonthly(c.estimatedCost || 0, c.period),
      raw: c.estimatedCost || 0,
      period: c.period || 'month',
    }));
    const monthlyRevenue = revenueItems.reduce((s, r) => s + r.monthly, 0);
    const monthlyCost = costItems.reduce((s, c) => s + c.monthly, 0);
    const netProfit = monthlyRevenue - monthlyCost;
    const margin = monthlyRevenue > 0 ? (netProfit / monthlyRevenue) * 100 : 0;
    const topRevenue = [...revenueItems].sort((a, b) => b.monthly - a.monthly)[0];
    const topCost = [...costItems].sort((a, b) => b.monthly - a.monthly)[0];
    return {
      revenueItems,
      costItems,
      monthlyRevenue,
      monthlyCost,
      netProfit,
      margin,
      topRevenue,
      topCost,
      numCustomerSegments: selectedCanvas.customerSegments.length,
      numKeyPartners: selectedCanvas.keyPartnerships.length,
    };
  }, [selectedCanvas]);

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> กลับ
          </button>
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Executive Dashboard</div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">ภาพรวมโมเดลธุรกิจ</h1>
          <p className="text-slate-600 mt-1">สรุป KPIs และ visualization สำหรับการตัดสินใจระดับผู้บริหาร · ค่าทั้งหมด normalize เป็นรายเดือน</p>
        </div>
      </div>

      {selectedCanvas && data ? (
        <div className="space-y-6">
          {/* Version Selector */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-700 mr-1">เวอร์ชัน:</span>
            <select
              value={selectedCanvas.id}
              onChange={(e) => {
                const c = canvases.find((cv) => cv.id === e.target.value);
                if (c) setSelectedCanvas(c);
              }}
              className="px-3 py-1.5 text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {canvases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.year} {c.quarter} · v{c.version}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500">{canvases.length} เวอร์ชันในระบบ</span>
          </div>

          {/* Metrics Cards */}
          {(() => {
            const metrics = {
              totalRevenue: data.monthlyRevenue,
              totalCost: data.monthlyCost,
              netProfit: data.netProfit,
              profitMargin: data.margin,
              numCustomerSegments: data.numCustomerSegments,
              numKeyPartners: data.numKeyPartners,
            };
            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <HeroKpi
                  label="Total Revenue"
                  sub="ต่อเดือน"
                  value={`${formatTHB(metrics.totalRevenue)} บาท`}
                  icon={<DollarSign className="w-5 h-5" />}
                  gradient="from-emerald-500 to-teal-600"
                />
                <HeroKpi
                  label="Total Cost"
                  sub="ต่อเดือน"
                  value={`${formatTHB(metrics.totalCost)} บาท`}
                  icon={<Receipt className="w-5 h-5" />}
                  gradient="from-rose-500 to-red-600"
                />
                <HeroKpi
                  label="Net Profit"
                  sub="ต่อเดือน"
                  value={`${formatTHB(metrics.netProfit)} บาท`}
                  icon={metrics.netProfit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  gradient={metrics.netProfit >= 0 ? 'from-indigo-500 to-violet-600' : 'from-rose-500 to-red-600'}
                />
                <HeroKpi
                  label="Profit Margin"
                  sub={metrics.profitMargin >= 0 ? 'กำไร' : 'ขาดทุน'}
                  value={`${metrics.profitMargin.toFixed(1)}%`}
                  icon={<Target className="w-5 h-5" />}
                  gradient={metrics.profitMargin >= 0 ? 'from-amber-500 to-orange-600' : 'from-rose-500 to-red-600'}
                />
                <HeroKpi
                  label="Customer Segments"
                  sub="กลุ่มเป้าหมาย"
                  value={String(metrics.numCustomerSegments)}
                  icon={<Users className="w-5 h-5" />}
                  gradient="from-blue-500 to-indigo-600"
                  small
                />
                <HeroKpi
                  label="Key Partners"
                  sub="พาร์ตเนอร์"
                  value={String(metrics.numKeyPartners)}
                  icon={<Handshake className="w-5 h-5" />}
                  gradient="from-purple-500 to-fuchsia-600"
                  small
                />
                <InsightCard data={data} />
              </div>
            );
          })()}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Pie */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900">สัดส่วนรายได้</h3>
                  <p className="text-xs text-slate-500">Revenue Breakdown · ต่อเดือน</p>
                </div>
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
              {data.revenueItems.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={data.revenueItems}
                      dataKey="monthly"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                      paddingAngle={2}
                    >
                      {data.revenueItems.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${formatTHB(Number(v))} บาท/เดือน`} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart label="ยังไม่มีข้อมูลรายได้" />
              )}
            </div>

            {/* Revenue vs Cost Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900">รายได้ vs ต้นทุน</h3>
                  <p className="text-xs text-slate-500">Revenue vs Cost · ต่อเดือน</p>
                </div>
                <Target className="w-5 h-5 text-indigo-500" />
              </div>
              {(data.revenueItems.length > 0 || data.costItems.length > 0) ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={[
                    { name: 'รวม', revenue: data.monthlyRevenue, cost: data.monthlyCost },
                    ...buildPairedRows(data.revenueItems, data.costItems),
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatTHB(Number(v), { compact: true })} />
                    <Tooltip formatter={(v) => `${formatTHB(Number(v))} บาท`} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="revenue" name="รายได้" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="cost" name="ต้นทุน" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart label="ยังไม่มีข้อมูล" />
              )}
            </div>
          </div>

          {/* Detail Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BreakdownTable
              title="Revenue Breakdown"
              subtitle="แหล่งรายได้ · ต่อเดือน"
              total={data.monthlyRevenue}
              items={data.revenueItems}
              accent="emerald"
            />
            <BreakdownTable
              title="Cost Breakdown"
              subtitle="โครงสร้างต้นทุน · ต่อเดือน"
              total={data.monthlyCost}
              items={data.costItems}
              accent="rose"
            />
          </div>
        </div>
      ) : (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl py-16 px-6 text-center">
          <p className="text-slate-700 font-medium mb-1">ยังไม่มี Business Model Canvas</p>
          <p className="text-slate-500 text-sm mb-5">สร้างเวอร์ชันแรกเพื่อเริ่มดูภาพรวม</p>
          <button
            onClick={() => router.push('/dashboard/admin/business-model')}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            ไปหน้า Business Model Canvas
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPairedRows(
  rev: Array<{ name: string; monthly: number }>,
  cost: Array<{ name: string; monthly: number }>
) {
  const max = Math.max(rev.length, cost.length);
  const rows: Array<{ name: string; revenue: number; cost: number }> = [];
  for (let i = 0; i < max; i++) {
    rows.push({
      name: rev[i]?.name || cost[i]?.name || `#${i + 1}`,
      revenue: rev[i]?.monthly || 0,
      cost: cost[i]?.monthly || 0,
    });
  }
  return rows;
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function HeroKpi({
  label, sub, value, icon, gradient, small,
}: { label: string; sub?: string; value: string; icon: React.ReactNode; gradient: string; small?: boolean }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between mb-2">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</div>
        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-sm`}>
          {icon}
        </div>
      </div>
      <div className={`${small ? 'text-2xl' : 'text-3xl'} font-bold text-slate-900 tracking-tight`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function InsightCard({ data }: { data: { topRevenue?: { name: string; monthly: number }; topCost?: { name: string; monthly: number }; monthlyRevenue: number; monthlyCost: number; margin: number } }) {
  const insights: string[] = [];
  if (data.topRevenue && data.monthlyRevenue > 0) {
    const pct = (data.topRevenue.monthly / data.monthlyRevenue) * 100;
    insights.push(`รายได้หลักมาจาก "${data.topRevenue.name}" (${pct.toFixed(0)}%)`);
  }
  if (data.topCost && data.monthlyCost > 0) {
    const pct = (data.topCost.monthly / data.monthlyCost) * 100;
    insights.push(`ต้นทุนสูงสุดคือ "${data.topCost.name}" (${pct.toFixed(0)}%)`);
  }
  if (data.margin < 10 && data.margin >= 0) insights.push('Margin ต่ำกว่า 10% ควรพิจารณาลดต้นทุนหรือปรับราคา');
  if (data.margin < 0) insights.push('สถานะขาดทุน — ต้องทบทวนโมเดลธุรกิจด่วน');
  if (insights.length === 0) insights.push('ข้อมูลยังไม่เพียงพอสำหรับการสรุป');

  return (
    <div className="col-span-2 lg:col-span-2 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="w-5 h-5 text-amber-600" />
        <div className="text-xs font-semibold text-amber-900 uppercase tracking-wider">Insights</div>
      </div>
      <ul className="space-y-1.5 text-sm text-slate-800">
        {insights.map((s, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-amber-600">•</span>
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
      {label}
    </div>
  );
}

function BreakdownTable({
  title, subtitle, total, items, accent,
}: {
  title: string; subtitle: string; total: number;
  items: Array<{ name: string; monthly: number; raw: number; period: 'month' | 'quarter' | 'year' }>;
  accent: 'emerald' | 'rose';
}) {
  const accentBar = accent === 'emerald' ? 'bg-emerald-500' : 'bg-rose-500';
  const accentText = accent === 'emerald' ? 'text-emerald-600' : 'text-rose-600';
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">รวม</div>
          <div className={`text-lg font-bold ${accentText}`}>{formatTHB(total)} บาท</div>
        </div>
      </div>
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((it, i) => {
            const pct = total > 0 ? (it.monthly / total) * 100 : 0;
            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-slate-800 truncate">{it.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {PERIOD_LABELS[it.period]}
                    </span>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className={`font-semibold ${accentText}`}>{formatTHB(it.monthly)}</span>
                    <span className="text-xs text-slate-500 ml-1.5">({pct.toFixed(0)}%)</span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${accentBar} rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">ยังไม่มีข้อมูล</p>
      )}
    </div>
  );
}
