'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BusinessModelCanvas, Quarter } from '@/types';
import { getBusinessModelCanvases, createBusinessModelCanvas } from '@/lib/business-model-canvas';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeToMonthly, formatTHB, PERIOD_LABELS } from '@/lib/bmc-utils';
import {
  Users, Sparkles, Send, Heart, DollarSign, Boxes, Activity, Handshake, Receipt,
  TrendingUp, TrendingDown, BarChart3, Clock, Pencil, Plus, ChevronRight, HelpCircle,
} from 'lucide-react';

export default function BusinessModelCanvasPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [canvases, setCanvases] = useState<BusinessModelCanvas[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCanvas, setSelectedCanvas] = useState<BusinessModelCanvas | null>(null);
  const [isCreating, setIsCreating] = useState(false);

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

  const handleCreateNew = async () => {
    const year = new Date().getFullYear();
    const quarter = getCurrentQuarter();

    if (!user) return;

    try {
      const newCanvas = {
        year,
        quarter,
        customerSegments: [],
        valuePropositions: [],
        channels: [],
        customerRelationships: [],
        revenueStreams: [],
        keyResources: [],
        keyActivities: [],
        keyPartnerships: [],
        costStructure: [],
        notes: '',
        createdBy: user.uid,
      };

      const id = await createBusinessModelCanvas(newCanvas);
      await loadCanvases();
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating canvas:', error);
    }
  };

  const getCurrentQuarter = (): Quarter => {
    const month = new Date().getMonth() + 1;
    if (month <= 3) return 'Q1';
    if (month <= 6) return 'Q2';
    if (month <= 9) return 'Q3';
    return 'Q4';
  };

  const metrics = useMemo(() => {
    if (!selectedCanvas) return null;
    const monthlyRevenue = selectedCanvas.revenueStreams.reduce(
      (sum, r) => sum + normalizeToMonthly(r.estimatedRevenue, r.period),
      0
    );
    const monthlyCost = selectedCanvas.costStructure.reduce(
      (sum, c) => sum + normalizeToMonthly(c.estimatedCost, c.period),
      0
    );
    const netProfit = monthlyRevenue - monthlyCost;
    const margin = monthlyRevenue > 0 ? (netProfit / monthlyRevenue) * 100 : 0;
    return { monthlyRevenue, monthlyCost, netProfit, margin };
  }, [selectedCanvas]);

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Strategy / Executive</div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Business Model Canvas</h1>
          <p className="text-slate-600 mt-1">มุมมองภาพรวม 9 องค์ประกอบของโมเดลธุรกิจ สำหรับการตัดสินใจระดับผู้บริหาร</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => router.push('/dashboard/admin/business-model/dashboard')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition text-sm font-medium text-slate-700"
          >
            <BarChart3 className="w-4 h-4" /> Dashboard
          </button>
          <button
            onClick={() => router.push('/dashboard/admin/business-model/timeline')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition text-sm font-medium text-slate-700"
          >
            <Clock className="w-4 h-4" /> Timeline
          </button>
          {selectedCanvas && (
            <button
              onClick={() => router.push(`/dashboard/admin/business-model/${selectedCanvas.id}`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition text-sm font-medium text-slate-700"
            >
              <Pencil className="w-4 h-4" /> แก้ไข
            </button>
          )}
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:shadow-md transition text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> เวอร์ชันใหม่
          </button>
        </div>
      </div>

      {selectedCanvas && metrics ? (
        <>
          {/* Version + KPI strip */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">เวอร์ชัน</div>
              <select
                value={selectedCanvas.id}
                onChange={(e) => {
                  const c = canvases.find((cv) => cv.id === e.target.value);
                  if (c) setSelectedCanvas(c);
                }}
                className="w-full text-base font-semibold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
              >
                {canvases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.year} {c.quarter} · v{c.version}
                  </option>
                ))}
              </select>
              <div className="mt-1 text-xs text-slate-500">{canvases.length} เวอร์ชันทั้งหมด</div>
            </div>

            <KpiCard
              label="รายได้ (ต่อเดือน)"
              value={formatTHB(metrics.monthlyRevenue) + ' บาท'}
              icon={<DollarSign className="w-5 h-5" />}
              tone="emerald"
            />
            <KpiCard
              label="ต้นทุน (ต่อเดือน)"
              value={formatTHB(metrics.monthlyCost) + ' บาท'}
              icon={<Receipt className="w-5 h-5" />}
              tone="rose"
            />
            <KpiCard
              label="กำไรสุทธิ (ต่อเดือน)"
              value={formatTHB(metrics.netProfit) + ' บาท'}
              sub={`Margin ${metrics.margin.toFixed(1)}%`}
              icon={metrics.netProfit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              tone={metrics.netProfit >= 0 ? 'indigo' : 'rose'}
            />
          </div>

          {/* BMC Grid - Standard 5-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-3 auto-rows-min">
            {/* Row 1: 4 top blocks (2 cols each), Customer Segments spans 2 rows */}
            <BlockCard
              className="lg:col-span-2 lg:row-span-2"
              icon={<Handshake className="w-4 h-4" />}
              title="Key Partnerships"
              subtitle="พาร์ตเนอร์สำคัญ"
              tone="indigo"
              items={selectedCanvas.keyPartnerships}
              tooltip={BLOCK_INFO.keyPartnerships.tooltip}
              examples={BLOCK_INFO.keyPartnerships.examples}
            />
            <BlockCard
              className="lg:col-span-2"
              icon={<Activity className="w-4 h-4" />}
              title="Key Activities"
              subtitle="กิจกรรมสำคัญ"
              tone="pink"
              items={selectedCanvas.keyActivities}
              tooltip={BLOCK_INFO.keyActivities.tooltip}
              examples={BLOCK_INFO.keyActivities.examples}
            />
            <BlockCard
              className="lg:col-span-2 lg:row-span-2"
              icon={<Sparkles className="w-4 h-4" />}
              title="Value Propositions"
              subtitle="คุณค่าที่นำเสนอ"
              tone="emerald"
              items={selectedCanvas.valuePropositions}
              tooltip={BLOCK_INFO.valuePropositions.tooltip}
              examples={BLOCK_INFO.valuePropositions.examples}
            />
            <BlockCard
              className="lg:col-span-2"
              icon={<Heart className="w-4 h-4" />}
              title="Customer Relationships"
              subtitle="ความสัมพันธ์กับลูกค้า"
              tone="orange"
              items={selectedCanvas.customerRelationships}
              tooltip={BLOCK_INFO.customerRelationships.tooltip}
              examples={BLOCK_INFO.customerRelationships.examples}
            />
            <BlockCard
              className="lg:col-span-2 lg:row-span-2"
              icon={<Users className="w-4 h-4" />}
              title="Customer Segments"
              subtitle="ลูกค้ากลุ่มเป้าหมาย"
              tone="blue"
              items={selectedCanvas.customerSegments}
              tooltip={BLOCK_INFO.customerSegments.tooltip}
              examples={BLOCK_INFO.customerSegments.examples}
            />
            {/* Row 2: Key Resources + Channels (Key Partners & Value Props & Customer Segments span) */}
            <BlockCard
              className="lg:col-span-2"
              icon={<Boxes className="w-4 h-4" />}
              title="Key Resources"
              subtitle="ทรัพยากรสำคัญ"
              tone="purple"
              items={selectedCanvas.keyResources}
              tooltip={BLOCK_INFO.keyResources.tooltip}
              examples={BLOCK_INFO.keyResources.examples}
            />
            <BlockCard
              className="lg:col-span-2"
              icon={<Send className="w-4 h-4" />}
              title="Channels"
              subtitle="ช่องทางจำหน่าย"
              tone="amber"
              items={selectedCanvas.channels}
              tooltip={BLOCK_INFO.channels.tooltip}
              examples={BLOCK_INFO.channels.examples}
            />
            {/* Row 3: Cost Structure (5) + Revenue Streams (5) */}
            <FinanceBlockCard
              className="lg:col-span-5"
              icon={<Receipt className="w-4 h-4" />}
              title="Cost Structure"
              subtitle="โครงสร้างต้นทุน"
              tone="slate"
              items={selectedCanvas.costStructure.map((c) => ({ name: c.name, amount: c.estimatedCost, period: c.period }))}
              tooltip={BLOCK_INFO.costStructure.tooltip}
              examples={BLOCK_INFO.costStructure.examples}
            />
            <FinanceBlockCard
              className="lg:col-span-5"
              icon={<DollarSign className="w-4 h-4" />}
              title="Revenue Streams"
              subtitle="แหล่งรายได้"
              tone="rose"
              items={selectedCanvas.revenueStreams.map((r) => ({ name: r.name, amount: r.estimatedRevenue, period: r.period }))}
              tooltip={BLOCK_INFO.revenueStreams.tooltip}
              examples={BLOCK_INFO.revenueStreams.examples}
            />
          </div>

          {/* Notes */}
          {selectedCanvas.notes && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-5 bg-indigo-500 rounded-full" />
                <h3 className="font-semibold text-slate-900">บันทึกเพิ่มเติม</h3>
              </div>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedCanvas.notes}</p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl py-16 px-6 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-indigo-50 flex items-center justify-center mb-4">
            <BarChart3 className="w-7 h-7 text-indigo-500" />
          </div>
          <p className="text-slate-700 font-medium mb-1">ยังไม่มี Business Model Canvas</p>
          <p className="text-slate-500 text-sm mb-5">เริ่มต้นด้วยการสร้างเวอร์ชันแรกของโมเดลธุรกิจ</p>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            <Plus className="w-4 h-4" /> สร้างเวอร์ชันแรก
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

type Tone = 'blue' | 'emerald' | 'amber' | 'orange' | 'rose' | 'purple' | 'pink' | 'indigo' | 'slate';

const TONES: Record<Tone, { bg: string; border: string; text: string; iconBg: string }> = {
  blue:    { bg: 'bg-blue-50/80',    border: 'border-blue-200',    text: 'text-blue-800',    iconBg: 'bg-blue-200 text-blue-700' },
  emerald: { bg: 'bg-emerald-50/80', border: 'border-emerald-200', text: 'text-emerald-800', iconBg: 'bg-emerald-200 text-emerald-700' },
  amber:   { bg: 'bg-amber-50/80',   border: 'border-amber-200',   text: 'text-amber-800',   iconBg: 'bg-amber-200 text-amber-700' },
  orange:  { bg: 'bg-orange-50/80',  border: 'border-orange-200',  text: 'text-orange-800',  iconBg: 'bg-orange-200 text-orange-700' },
  rose:    { bg: 'bg-rose-50/80',    border: 'border-rose-200',    text: 'text-rose-800',    iconBg: 'bg-rose-200 text-rose-700' },
  purple: { bg: 'bg-purple-50/80',  border: 'border-purple-200',  text: 'text-purple-800',  iconBg: 'bg-purple-200 text-purple-700' },
  pink:    { bg: 'bg-pink-50/80',    border: 'border-pink-200',    text: 'text-pink-800',    iconBg: 'bg-pink-200 text-pink-700' },
  indigo:  { bg: 'bg-indigo-50/80',  border: 'border-indigo-200',  text: 'text-indigo-800',  iconBg: 'bg-indigo-200 text-indigo-700' },
  slate:   { bg: 'bg-slate-100',     border: 'border-slate-300',   text: 'text-slate-800',   iconBg: 'bg-slate-300 text-slate-800' },
};

const BLOCK_INFO: Record<string, { tooltip: string; examples: string }> = {
  customerSegments: { tooltip: 'กลุ่มลูกค้าที่เราต้องการบริการ แบ่งตามลักษณะเฉพาะ', examples: 'B2B SMEs, ร้านค้าออนไลน์, ห้างร้าน, บริษัทผลิตเสื้อผ้า' },
  valuePropositions: { tooltip: 'สิ่งที่เรานำเสนอให้ลูกค้าที่แตกต่างจากคู่แข่ง', examples: 'ผ้าคุณภาพสูง, ราคาแข่งขันได้, ส่งฟรี, รับประกันคุณภาพ' },
  channels: { tooltip: 'ช่องทางที่เราใช้ติดต่อและส่งมอบคุณค่าให้ลูกค้า', examples: 'เว็บไซต์, LINE OA, Facebook, Instagram, ตัวแทนจำหน่าย, หน้าร้าน' },
  customerRelationships: { tooltip: 'ประเภทความสัมพันธ์ที่เราสร้างกับลูกค้าแต่ละกลุ่ม', examples: 'Personal Assistant, Self-service, Community, Co-creation' },
  keyResources: { tooltip: 'ทรัพยากรที่จำเป็นต่อการทำงานของโมเดลธุรกิจ', examples: 'โรงงาน, คลังสินค้า, เครื่องจักร, ทีมงาน, เงินทุน' },
  keyActivities: { tooltip: 'กิจกรรมที่ต้องทำเพื่อให้โมเดลธุรกิจทำงานได้', examples: 'ผลิตผ้า, ควบคุมคุณภาพ, ตลาด, ขาย, บริการลูกค้า' },
  keyPartnerships: { tooltip: 'ผู้ที่เราทำงานด้วยเพื่อลดความเสี่ยงและเพิ่มประสิทธิภาพ', examples: 'ซัพพลายเออร์ผ้า, โลจิสติกส์, ตัวแทนจำหน่าย, คู่ค้าค้าส่ง' },
  revenueStreams: { tooltip: 'วิธีที่เราสร้างรายได้จากลูกค้าแต่ละกลุ่ม', examples: 'ขายส่ง, ขายปลีก, ค่าบริการตัดเย็บ, ค่าสมัครสมาชิก' },
  costStructure: { tooltip: 'ต้นทุนที่จำเป็นต่อการดำเนินงานโมเดลธุรกิจ', examples: 'ค่าวัตถุดิบ, ค่าแรง, เช่าสถานที่, ค่าโฆษณา, ค่าไฟฟ้า' },
};

function KpiCard({
  label, value, sub, icon, tone = 'indigo',
}: { label: string; value: string; sub?: string; icon: React.ReactNode; tone?: 'emerald' | 'rose' | 'indigo' }) {
  const palette: Record<string, string> = {
    emerald: 'from-emerald-500 to-teal-600',
    rose: 'from-rose-500 to-red-600',
    indigo: 'from-indigo-500 to-violet-600',
  };
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between mb-2">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</div>
        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${palette[tone]} text-white flex items-center justify-center shadow-sm`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function BlockCard({
  className = '', icon, title, subtitle, tone, items, tooltip, examples,
}: {
  className?: string; icon: React.ReactNode; title: string; subtitle: string; tone: Tone; items: string[];
  tooltip?: string;
  examples?: string;
}) {
  const t = TONES[tone];
  const tooltipText = tooltip ? `${tooltip}\n\nตัวอย่าง: ${examples}` : '';
  return (
    <div className={`${className} ${t.bg} border ${t.border} rounded-xl p-4 shadow-sm hover:shadow-md transition`}>
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-7 h-7 rounded-lg ${t.iconBg} flex items-center justify-center`}>{icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-slate-900 text-sm leading-tight">{title}</h3>
            {tooltip && (
              <span title={tooltipText} className="cursor-help">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition" />
              </span>
            )}
          </div>
          <p className={`text-xs ${t.text}`}>{subtitle}</p>
        </div>
        <span className="text-xs font-medium text-slate-500 bg-white px-1.5 py-0.5 rounded-md border border-slate-200">{items.length}</span>
      </div>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-slate-800 flex gap-2 leading-relaxed">
              <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-slate-500 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-slate-500 italic">ยังไม่มีข้อมูล</p>
      )}
    </div>
  );
}

function FinanceBlockCard({
  className = '', icon, title, subtitle, tone, items, tooltip, examples,
}: {
  className?: string; icon: React.ReactNode; title: string; subtitle: string; tone: Tone;
  items: Array<{ name: string; amount: number; period: 'month' | 'quarter' | 'year' | undefined }>;
  tooltip?: string;
  examples?: string;
}) {
  const t = TONES[tone];
  const totalMonthly = items.reduce((s, i) => s + normalizeToMonthly(i.amount || 0, i.period), 0);
  const tooltipText = tooltip ? `${tooltip}\n\nตัวอย่าง: ${examples}` : '';
  return (
    <div className={`${className} ${t.bg} border ${t.border} rounded-xl p-4 shadow-sm hover:shadow-md transition`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-lg ${t.iconBg} flex items-center justify-center`}>{icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-slate-900 text-sm leading-tight">{title}</h3>
            {tooltip && (
              <span title={tooltipText} className="cursor-help">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition" />
              </span>
            )}
          </div>
          <p className={`text-xs ${t.text}`}>{subtitle}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">รวม/เดือน</div>
          <div className="text-sm font-bold text-slate-900">{formatTHB(totalMonthly)} บาท</div>
        </div>
      </div>
      {items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-center justify-between gap-2 text-sm bg-white/60 rounded-md px-2.5 py-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-slate-900 truncate">{item.name || '(ไม่ระบุชื่อ)'}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                  {PERIOD_LABELS[item.period || 'month']}
                </span>
              </div>
              <span className="font-semibold text-slate-950 whitespace-nowrap">{formatTHB(item.amount || 0)} บาท</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-500 italic">ยังไม่มีข้อมูล</p>
      )}
    </div>
  );
}
