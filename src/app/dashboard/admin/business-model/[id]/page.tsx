'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BusinessModelCanvas } from '@/types';
import { getBusinessModelCanvasById, updateBusinessModelCanvas, deleteBusinessModelCanvas } from '@/lib/business-model-canvas';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft, Save, Plus, X, Users, Sparkles, Send, Heart, DollarSign,
  Boxes, Activity, Handshake, Receipt, FileText, Trash2, HelpCircle,
} from 'lucide-react';

export default function BusinessModelCanvasDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [canvas, setCanvas] = useState<BusinessModelCanvas | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<Partial<BusinessModelCanvas>>({});

  useEffect(() => {
    loadCanvas();
  }, [params.id]);

  const loadCanvas = async () => {
    try {
      const data = await getBusinessModelCanvasById(params.id as string);
      if (data) {
        setCanvas(data);
        setFormData(data);
      }
    } catch (error) {
      console.error('Error loading canvas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!canvas || !user) return;

    setSaving(true);
    try {
      await updateBusinessModelCanvas(canvas.id, formData);
      setCanvas({ ...canvas, ...formData });
      alert('บันทึกสำเร็จ');
    } catch (error) {
      console.error('Error saving canvas:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!canvas) return;

    setDeleting(true);
    try {
      await deleteBusinessModelCanvas(canvas.id);
      alert('ลบ Business Model Canvas สำเร็จ');
      router.push('/dashboard/admin/business-model');
    } catch (error) {
      console.error('Error deleting canvas:', error);
      alert('เกิดข้อผิดพลาดในการลบ');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleAddItem = (field: keyof BusinessModelCanvas) => {
    if (field === 'revenueStreams') {
      setFormData({
        ...formData,
        revenueStreams: [
          ...(formData.revenueStreams || []),
          { name: '', estimatedRevenue: 0, period: 'month' as 'month' | 'quarter' | 'year' },
        ],
      });
    } else if (field === 'costStructure') {
      setFormData({
        ...formData,
        costStructure: [
          ...(formData.costStructure || []),
          { name: '', estimatedCost: 0, period: 'month' as 'month' | 'quarter' | 'year' },
        ],
      });
    } else if (
      field === 'customerSegments' ||
      field === 'valuePropositions' ||
      field === 'channels' ||
      field === 'customerRelationships' ||
      field === 'keyResources' ||
      field === 'keyActivities' ||
      field === 'keyPartnerships'
    ) {
      setFormData({
        ...formData,
        [field]: [...(formData[field] as string[] || []), ''],
      });
    }
  };

  const handleRemoveItem = (field: keyof BusinessModelCanvas, index: number) => {
    if (field === 'revenueStreams') {
      const newStreams = [...(formData.revenueStreams || [])];
      newStreams.splice(index, 1);
      setFormData({ ...formData, revenueStreams: newStreams });
    } else if (field === 'costStructure') {
      const newCosts = [...(formData.costStructure || [])];
      newCosts.splice(index, 1);
      setFormData({ ...formData, costStructure: newCosts });
    } else if (
      field === 'customerSegments' ||
      field === 'valuePropositions' ||
      field === 'channels' ||
      field === 'customerRelationships' ||
      field === 'keyResources' ||
      field === 'keyActivities' ||
      field === 'keyPartnerships'
    ) {
      const newArray = [...(formData[field] as string[] || [])];
      newArray.splice(index, 1);
      setFormData({ ...formData, [field]: newArray });
    }
  };

  const formatNumberWithCommas = (value: number | string | undefined): string => {
    if (value === '' || value === undefined || value === null) return '';
    const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US');
  };

  const parseNumberFromCommas = (value: string): number => {
    if (!value) return 0;
    const num = parseFloat(value.replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const handleItemChange = (
    field: keyof BusinessModelCanvas,
    index: number,
    value: string | number,
    subField?: 'name' | 'estimatedRevenue' | 'estimatedCost' | 'period'
  ) => {
    if (field === 'revenueStreams') {
      const newStreams = [...(formData.revenueStreams || [])];
      if (subField === 'period') {
        newStreams[index].period = value as 'month' | 'quarter' | 'year';
      } else if (subField === 'estimatedRevenue') {
        newStreams[index].estimatedRevenue = parseNumberFromCommas(value as string);
      } else if (typeof value === 'string') {
        newStreams[index].name = value;
      } else {
        newStreams[index].estimatedRevenue = value;
      }
      setFormData({ ...formData, revenueStreams: newStreams });
    } else if (field === 'costStructure') {
      const newCosts = [...(formData.costStructure || [])];
      if (subField === 'period') {
        newCosts[index].period = value as 'month' | 'quarter' | 'year';
      } else if (subField === 'estimatedCost') {
        newCosts[index].estimatedCost = parseNumberFromCommas(value as string);
      } else if (typeof value === 'string') {
        newCosts[index].name = value;
      } else {
        newCosts[index].estimatedCost = value;
      }
      setFormData({ ...formData, costStructure: newCosts });
    } else if (
      field === 'customerSegments' ||
      field === 'valuePropositions' ||
      field === 'channels' ||
      field === 'customerRelationships' ||
      field === 'keyResources' ||
      field === 'keyActivities' ||
      field === 'keyPartnerships'
    ) {
      const newArray = [...(formData[field] as string[] || [])];
      newArray[index] = value as string;
      setFormData({ ...formData, [field]: newArray });
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!canvas) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">ไม่พบ Business Model Canvas</div>
      </div>
    );
  }

  const stringFields: Array<{
    key: 'customerSegments' | 'valuePropositions' | 'channels' | 'customerRelationships' | 'keyResources' | 'keyActivities' | 'keyPartnerships';
    title: string; subtitle: string; icon: React.ReactNode; tone: ToneKey;
    section: 'customer' | 'ops';
    tooltip: string;
    examples: string;
  }> = [
    { key: 'customerSegments', title: 'Customer Segments', subtitle: 'ลูกค้ากลุ่มเป้าหมาย', icon: <Users className="w-4 h-4" />, tone: 'blue', section: 'customer', tooltip: 'กลุ่มลูกค้าที่เราต้องการบริการ แบ่งตามลักษณะเฉพาะ', examples: 'B2B SMEs, ร้านค้าออนไลน์, ห้างร้าน, บริษัทผลิตเสื้อผ้า' },
    { key: 'valuePropositions', title: 'Value Propositions', subtitle: 'คุณค่าที่นำเสนอ', icon: <Sparkles className="w-4 h-4" />, tone: 'emerald', section: 'customer', tooltip: 'สิ่งที่เรานำเสนอให้ลูกค้าที่แตกต่างจากคู่แข่ง', examples: 'ผ้าคุณภาพสูง, ราคาแข่งขันได้, ส่งฟรี, รับประกันคุณภาพ' },
    { key: 'channels', title: 'Channels', subtitle: 'ช่องทางจำหน่าย', icon: <Send className="w-4 h-4" />, tone: 'amber', section: 'customer', tooltip: 'ช่องทางที่เราใช้ติดต่อและส่งมอบคุณค่าให้ลูกค้า', examples: 'เว็บไซต์, LINE OA, Facebook, Instagram, ตัวแทนจำหน่าย, หน้าร้าน' },
    { key: 'customerRelationships', title: 'Customer Relationships', subtitle: 'ความสัมพันธ์กับลูกค้า', icon: <Heart className="w-4 h-4" />, tone: 'orange', section: 'customer', tooltip: 'ประเภทความสัมพันธ์ที่เราสร้างกับลูกค้าแต่ละกลุ่ม', examples: 'Personal Assistant, Self-service, Community, Co-creation' },
    { key: 'keyResources', title: 'Key Resources', subtitle: 'ทรัพยากรสำคัญ', icon: <Boxes className="w-4 h-4" />, tone: 'purple', section: 'ops', tooltip: 'ทรัพยากรที่จำเป็นต่อการทำงานของโมเดลธุรกิจ', examples: 'โรงงาน, คลังสินค้า, เครื่องจักร, ทีมงาน, เงินทุน' },
    { key: 'keyActivities', title: 'Key Activities', subtitle: 'กิจกรรมสำคัญ', icon: <Activity className="w-4 h-4" />, tone: 'pink', section: 'ops', tooltip: 'กิจกรรมที่ต้องทำเพื่อให้โมเดลธุรกิจทำงานได้', examples: 'ผลิตผ้า, ควบคุมคุณภาพ, ตลาด, ขาย, บริการลูกค้า' },
    { key: 'keyPartnerships', title: 'Key Partnerships', subtitle: 'พาร์ตเนอร์สำคัญ', icon: <Handshake className="w-4 h-4" />, tone: 'indigo', section: 'ops', tooltip: 'ผู้ที่เราทำงานด้วยเพื่อลดความเสี่ยงและเพิ่มประสิทธิภาพ', examples: 'ซัพพลายเออร์ผ้า, โลจิสติกส์, ตัวแทนจำหน่าย, คู่ค้าค้าส่ง' },
  ];

  return (
    <div className="bg-slate-50/50 min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="px-6 lg:px-8 py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="min-w-0">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> กลับ
            </button>
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 truncate">
              แก้ไข Business Model Canvas
            </h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">
                {canvas.year} · {canvas.quarter}
              </span>
              <span className="text-slate-400">·</span>
              <span>v{canvas.version}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 transition disabled:opacity-50 font-medium"
            >
              <Trash2 className="w-4 h-4" /> {deleting ? 'กำลังลบ...' : 'ลบ'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:shadow-md transition disabled:opacity-50 font-semibold shadow-sm"
            >
              <Save className="w-4 h-4" /> {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-8 py-6 space-y-8">
        {/* Section: Customer & Value */}
        <Section title="ลูกค้าและคุณค่า" subtitle="Customer & Value · กลุ่มเป้าหมาย คุณค่า ช่องทาง และความสัมพันธ์">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stringFields.filter((f) => f.section === 'customer').map((f) => (
              <StringBlock
                key={f.key}
                title={f.title}
                subtitle={f.subtitle}
                icon={f.icon}
                tone={f.tone}
                tooltip={f.tooltip}
                examples={f.examples}
                items={(formData[f.key] as string[]) || []}
                onChange={(i, v) => handleItemChange(f.key, i, v)}
                onRemove={(i) => handleRemoveItem(f.key, i)}
                onAdd={() => handleAddItem(f.key)}
              />
            ))}
          </div>
        </Section>

        {/* Section: Operations */}
        <Section title="ทรัพยากรและกิจกรรม" subtitle="Operations · ทรัพยากร กิจกรรม และพาร์ตเนอร์">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stringFields.filter((f) => f.section === 'ops').map((f) => (
              <StringBlock
                key={f.key}
                title={f.title}
                subtitle={f.subtitle}
                icon={f.icon}
                tone={f.tone}
                tooltip={f.tooltip}
                examples={f.examples}
                items={(formData[f.key] as string[]) || []}
                onChange={(i, v) => handleItemChange(f.key, i, v)}
                onRemove={(i) => handleRemoveItem(f.key, i)}
                onAdd={() => handleAddItem(f.key)}
              />
            ))}
          </div>
        </Section>

        {/* Section: Finance */}
        <Section title="การเงิน" subtitle="Finance · รายได้และต้นทุน พร้อมระบุรอบเวลา">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FinanceBlock
              title="Revenue Streams"
              subtitle="แหล่งรายได้"
              icon={<DollarSign className="w-4 h-4" />}
              tone="rose"
              tooltip="วิธีที่เราสร้างรายได้จากลูกค้าแต่ละกลุ่ม"
              examples="ขายส่ง, ขายปลีก, ค่าบริการตัดเย็บ, ค่าสมัครสมาชิก"
              items={(formData.revenueStreams || []).map((r) => ({ name: r.name, amount: r.estimatedRevenue, period: r.period }))}
              onNameChange={(i, v) => handleItemChange('revenueStreams', i, v, 'name')}
              onAmountChange={(i, v) => handleItemChange('revenueStreams', i, v, 'estimatedRevenue')}
              onPeriodChange={(i, v) => handleItemChange('revenueStreams', i, v, 'period')}
              onRemove={(i) => handleRemoveItem('revenueStreams', i)}
              onAdd={() => handleAddItem('revenueStreams')}
              format={formatNumberWithCommas}
            />
            <FinanceBlock
              title="Cost Structure"
              subtitle="โครงสร้างต้นทุน"
              icon={<Receipt className="w-4 h-4" />}
              tone="slate"
              tooltip="ต้นทุนที่จำเป็นต่อการดำเนินงานโมเดลธุรกิจ"
              examples="ค่าวัตถุดิบ, ค่าแรง, เช่าสถานที่, ค่าโฆษณา, ค่าไฟฟ้า"
              items={(formData.costStructure || []).map((c) => ({ name: c.name, amount: c.estimatedCost, period: c.period }))}
              onNameChange={(i, v) => handleItemChange('costStructure', i, v, 'name')}
              onAmountChange={(i, v) => handleItemChange('costStructure', i, v, 'estimatedCost')}
              onPeriodChange={(i, v) => handleItemChange('costStructure', i, v, 'period')}
              onRemove={(i) => handleRemoveItem('costStructure', i)}
              onAdd={() => handleAddItem('costStructure')}
              format={formatNumberWithCommas}
            />
          </div>
        </Section>

        {/* Notes */}
        <Section title="บันทึกเพิ่มเติม" subtitle="Notes · ข้อมูลประกอบเพิ่มเติม">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">บันทึก / Notes</span>
            </div>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              rows={4}
              placeholder="ข้อมูลประกอบ บริบท หรือข้อสังเกตเพิ่มเติม..."
            />
          </div>
        </Section>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">ยืนยันการลบ</h3>
            </div>
            <p className="text-slate-600 mb-6">
              คุณต้องการลบ Business Model Canvas เวอร์ชัน <span className="font-semibold">{canvas?.year} · {canvas?.quarter} v{canvas?.version}</span> ใช่ไหม?
              <br /><br />
              <span className="text-rose-600">การกระทำนี้ไม่สามารถย้อนกลับได้</span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-medium disabled:opacity-50"
              >
                {deleting ? 'กำลังลบ...' : 'ยืนยันลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

type ToneKey = 'blue' | 'emerald' | 'amber' | 'orange' | 'rose' | 'purple' | 'pink' | 'indigo' | 'slate';

const TONE_MAP: Record<ToneKey, { iconBg: string; text: string; addBtn: string }> = {
  blue:    { iconBg: 'bg-blue-100 text-blue-600',       text: 'text-blue-700',    addBtn: 'text-blue-600 hover:bg-blue-50 border-blue-200' },
  emerald: { iconBg: 'bg-emerald-100 text-emerald-600', text: 'text-emerald-700', addBtn: 'text-emerald-600 hover:bg-emerald-50 border-emerald-200' },
  amber:   { iconBg: 'bg-amber-100 text-amber-600',     text: 'text-amber-700',   addBtn: 'text-amber-600 hover:bg-amber-50 border-amber-200' },
  orange:  { iconBg: 'bg-orange-100 text-orange-600',   text: 'text-orange-700',  addBtn: 'text-orange-600 hover:bg-orange-50 border-orange-200' },
  rose:    { iconBg: 'bg-rose-100 text-rose-600',       text: 'text-rose-700',    addBtn: 'text-rose-600 hover:bg-rose-50 border-rose-200' },
  purple:  { iconBg: 'bg-purple-100 text-purple-600',   text: 'text-purple-700',  addBtn: 'text-purple-600 hover:bg-purple-50 border-purple-200' },
  pink:    { iconBg: 'bg-pink-100 text-pink-600',       text: 'text-pink-700',    addBtn: 'text-pink-600 hover:bg-pink-50 border-pink-200' },
  indigo:  { iconBg: 'bg-indigo-100 text-indigo-600',   text: 'text-indigo-700',  addBtn: 'text-indigo-600 hover:bg-indigo-50 border-indigo-200' },
  slate:   { iconBg: 'bg-slate-200 text-slate-700',     text: 'text-slate-700',   addBtn: 'text-slate-600 hover:bg-slate-50 border-slate-200' },
};

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-3">
        <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-full" />
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
        <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function StringBlock({
  title, subtitle, icon, tone, items, onChange, onRemove, onAdd, tooltip, examples,
}: {
  title: string; subtitle: string; icon: React.ReactNode; tone: ToneKey;
  items: string[];
  onChange: (i: number, v: string) => void;
  onRemove: (i: number) => void;
  onAdd: () => void;
  tooltip?: string;
  examples?: string;
}) {
  const t = TONE_MAP[tone];
  const tooltipText = tooltip ? `${tooltip}\n\nตัวอย่าง: ${examples}` : '';
  const placeholderText = examples ? `เช่น ${examples}` : 'พิมพ์รายการที่นี่...';
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-lg ${t.iconBg} flex items-center justify-center`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-slate-900 text-sm leading-tight">{title}</h3>
            {tooltip && (
              <span title={tooltipText} className="cursor-help">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition" />
              </span>
            )}
          </div>
          <p className={`text-xs ${t.text} truncate`}>{subtitle}</p>
        </div>
        <span className="text-xs font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-200">{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-1.5 items-center">
            <input
              type="text"
              value={item}
              onChange={(e) => onChange(i, e.target.value)}
              placeholder={placeholderText}
              className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={() => onRemove(i)}
              aria-label="ลบรายการ"
              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button
          onClick={onAdd}
          className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-dashed rounded-md text-sm font-medium transition ${t.addBtn}`}
        >
          <Plus className="w-3.5 h-3.5" /> เพิ่มรายการ
        </button>
      </div>
    </div>
  );
}

function FinanceBlock({
  title, subtitle, icon, tone, items, onNameChange, onAmountChange, onPeriodChange, onRemove, onAdd, format, tooltip, examples,
}: {
  title: string; subtitle: string; icon: React.ReactNode; tone: ToneKey;
  items: Array<{ name: string; amount: number | undefined; period: 'month' | 'quarter' | 'year' | undefined }>;
  onNameChange: (i: number, v: string) => void;
  onAmountChange: (i: number, v: string) => void;
  onPeriodChange: (i: number, v: string) => void;
  onRemove: (i: number) => void;
  onAdd: () => void;
  format: (v: number | string | undefined) => string;
  tooltip?: string;
  examples?: string;
}) {
  const t = TONE_MAP[tone];
  const tooltipText = tooltip ? `${tooltip}\n\nตัวอย่าง: ${examples}` : '';
  const placeholderText = examples ? `เช่น ${examples}` : 'ชื่อรายการ';
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-lg ${t.iconBg} flex items-center justify-center`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-slate-900 text-sm leading-tight">{title}</h3>
            {tooltip && (
              <span title={tooltipText} className="cursor-help">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition" />
              </span>
            )}
          </div>
          <p className={`text-xs ${t.text} truncate`}>{subtitle}</p>
        </div>
        <span className="text-xs font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-200">{items.length}</span>
      </div>
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <div key={i} className="bg-slate-50/60 border border-slate-200 rounded-lg p-2.5 space-y-2">
            <div className="flex gap-1.5 items-center">
              <input
                type="text"
                placeholder={placeholderText}
                value={item.name}
                onChange={(e) => onNameChange(i, e.target.value)}
                className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={() => onRemove(i)}
                aria-label="ลบรายการ"
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="จำนวนเงิน"
                  value={format(item.amount as number)}
                  onChange={(e) => onAmountChange(i, e.target.value)}
                  className="w-full pl-2.5 pr-12 py-1.5 border border-slate-200 rounded-md text-sm text-right font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">บาท</span>
              </div>
              <select
                value={item.period || 'month'}
                onChange={(e) => onPeriodChange(i, e.target.value)}
                className="px-2 py-1.5 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="month">รายเดือน</option>
                <option value="quarter">รายไตรมาส</option>
                <option value="year">รายปี</option>
              </select>
            </div>
          </div>
        ))}
        <button
          onClick={onAdd}
          className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-dashed rounded-md text-sm font-medium transition ${t.addBtn}`}
        >
          <Plus className="w-3.5 h-3.5" /> เพิ่มรายการ
        </button>
      </div>
    </div>
  );
}
