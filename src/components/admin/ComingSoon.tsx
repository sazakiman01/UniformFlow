import { Construction } from "lucide-react";

export default function ComingSoon({ title, eta }: { title: string; eta: string }) {
  return (
    <div className="p-6 sm:p-10 text-center">
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 p-8">
        <Construction className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>
        <p className="text-sm text-gray-600">กำลังพัฒนา — คาดว่าเสร็จ {eta}</p>
      </div>
    </div>
  );
}
