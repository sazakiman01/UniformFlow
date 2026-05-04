"use client";

import { useId, useState, useRef, useCallback } from "react";
import { Upload, X, AlertCircle, Trash2, Check } from "lucide-react";
import { getColorAtPixel, loadImageFromFile } from "@/lib/color-extraction";

interface ColorExtractorProps {
  onColorsAdd: (hexColors: string[]) => void;
  maxColors?: number;
}

interface PickedColor {
  hex: string;
  // Position as percentage of image rect (0-1) for responsive accuracy
  xPct: number;
  yPct: number;
}

const DEFAULT_MAX_PICKED_COLORS = 18;

export default function ColorExtractor({ onColorsAdd, maxColors = DEFAULT_MAX_PICKED_COLORS }: ColorExtractorProps) {
  const inputId = useId();
  const [image, setImage] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [pickedColors, setPickedColors] = useState<PickedColor[]>([]);
  const [hoverColor, setHoverColor] = useState<string | null>(null);
  const [magnifierPosition, setMagnifierPosition] = useState<{ x: number; y: number } | null>(null);
  const [highlightedHex, setHighlightedHex] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "warning" | "info" } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string, type: "warning" | "info" = "warning") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  };

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    setPickedColors([]);
    setHoverColor(null);

    try {
      const img = await loadImageFromFile(file);
      setImageElement(img);
      setImage(img.src);
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถโหลดรูปได้");
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFileUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageElement || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    try {
      const hex = getColorAtPixel(imageElement, x, y, rect.width, rect.height, canvasRef.current || undefined);

      if (pickedColors.some((c) => c.hex === hex)) {
        showToast(`สี ${hex} เลือกไปแล้ว`, "info");
      } else if (pickedColors.length >= maxColors) {
        showToast(`ครบ ${maxColors} สีแล้ว ลบบางสีก่อน`, "warning");
      } else {
        setPickedColors([
          ...pickedColors,
          { hex, xPct: x / rect.width, yPct: y / rect.height },
        ]);
      }

      setHoverColor(null);
      setMagnifierPosition(null);
    } catch (err) {
      console.error("Error picking color:", err);
    }
  };

  const handleImageHover = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageElement || !imageRef.current) return;

    const clientX = e.clientX;
    const clientY = e.clientY;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!imageRef.current || !imageElement) return;
      const rect = imageRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      try {
        const color = getColorAtPixel(imageElement, x, y, rect.width, rect.height, canvasRef.current || undefined);
        setHoverColor(color);

        const size = 70;
        let mx = x + 20;
        let my = y - size - 10;

        if (mx + size > rect.width) mx = x - size - 20;
        if (mx < 0) mx = 5;
        if (my < 0) my = y + 20;
        if (my + size > rect.height) my = rect.height - size - 5;

        setMagnifierPosition({ x: mx, y: my });
      } catch (err) {
        console.error("Error getting hover color:", err);
      }
    });
  }, [imageElement]);

  const handleImageLeave = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setHoverColor(null);
    setMagnifierPosition(null);
  };

  const handleRemoveColor = (hexToRemove: string) => {
    setPickedColors(pickedColors.filter((c) => c.hex !== hexToRemove));
    if (highlightedHex === hexToRemove) setHighlightedHex(null);
  };

  const handleAddAllColors = () => {
    if (pickedColors.length > 0) {
      onColorsAdd(pickedColors.map((c) => c.hex));
      setPickedColors([]);
      showToast(`เพิ่ม ${pickedColors.length} สีเรียบร้อย`, "info");
    }
  };

  const handleReset = () => {
    setImage(null);
    setImageElement(null);
    setPickedColors([]);
    setHoverColor(null);
    setError(null);
    setToast(null);
    setHighlightedHex(null);
  };

  return (
    <div className="space-y-3">
      {/* Tips */}
      <div className="text-xs text-gray-700 bg-blue-50 border border-blue-100 p-2.5 rounded-lg">
        <p className="font-medium mb-1 text-blue-900">💡 วิธีการถ่ายรูปให้ได้สีที่ตรง:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>ถ่ายรูปผ้าใกล้ๆ หรือครอบตัดพื้นหลังออก</li>
          <li>ให้แสงสว่างเพียงพอและไม่มีเงา</li>
          <li>หลีกเลี่ยงพื้นหลังที่มีสีเด่น</li>
        </ul>
      </div>

      {/* Upload Area */}
      {!image ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer"
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            id={inputId}
          />
          <label htmlFor={inputId} className="cursor-pointer block">
            <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-700">คลิกเพื่ออัพโหลดรูปผ้า</p>
            <p className="text-xs text-gray-500 mt-1">หรือลากรูปมาวางที่นี่</p>
          </label>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Image Preview */}
          <div className="relative bg-gray-50 rounded-lg overflow-hidden">
            <img
              ref={imageRef}
              src={image}
              alt="Uploaded fabric"
              className="w-full max-h-72 object-contain cursor-crosshair select-none"
              onClick={handleImageClick}
              onMouseMove={handleImageHover}
              onMouseLeave={handleImageLeave}
              draggable={false}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-full p-1.5 shadow-md hover:bg-white hover:scale-110 transition-all z-10"
              aria-label="ลบรูป"
            >
              <X className="w-4 h-4 text-gray-700" />
            </button>

            {/* Position Markers - แสดงจุดที่เลือกสีไว้บนรูป */}
            {pickedColors.map((c, idx) => {
              const isHighlighted = highlightedHex === c.hex;
              return (
                <div
                  key={`marker-${c.hex}-${idx}`}
                  className="absolute pointer-events-none rounded-full border-2 transition-all duration-200"
                  style={{
                    left: `${c.xPct * 100}%`,
                    top: `${c.yPct * 100}%`,
                    transform: `translate(-50%, -50%) scale(${isHighlighted ? 1.6 : 1})`,
                    width: 16,
                    height: 16,
                    backgroundColor: c.hex,
                    borderColor: isHighlighted ? "#3b82f6" : "white",
                    opacity: isHighlighted ? 1 : 0.75,
                    zIndex: isHighlighted ? 30 : 20,
                    boxShadow: isHighlighted
                      ? "0 0 0 3px rgba(59,130,246,0.4), 0 4px 12px rgba(0,0,0,0.4)"
                      : "0 0 0 1px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.3)",
                  }}
                />
              );
            })}

            {/* Magnifier */}
            {magnifierPosition && hoverColor && (
              <div
                className="absolute pointer-events-none rounded-full shadow-xl ring-2 ring-white overflow-hidden z-40"
                style={{
                  left: magnifierPosition.x,
                  top: magnifierPosition.y,
                  width: 70,
                  height: 70,
                  backgroundColor: hoverColor,
                }}
              >
                <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-[10px] font-mono py-0.5 text-center">
                  {hoverColor}
                </div>
              </div>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600">กำลังโหลดรูป...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Toast */}
          {toast && (
            <div
              className={`flex items-center gap-2 text-sm p-2.5 rounded-lg border transition-all ${
                toast.type === "warning"
                  ? "text-amber-700 bg-amber-50 border-amber-200"
                  : "text-blue-700 bg-blue-50 border-blue-200"
              }`}
            >
              {toast.type === "warning" ? (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <Check className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{toast.msg}</span>
            </div>
          )}

          {/* Empty State */}
          {pickedColors.length === 0 && !loading && (
            <p className="text-xs text-gray-500 text-center py-1">
              👆 คลิกบนรูปเพื่อเลือกสี (สูงสุด {maxColors} สี)
            </p>
          )}

          {/* Palette */}
          {pickedColors.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">สีที่เลือก</p>
                <span className="text-xs text-gray-500 font-mono">
                  {pickedColors.length}/{maxColors}
                </span>
              </div>
              <p className="text-xs text-gray-500 -mt-1">
                💡 ชี้ที่สีเพื่อดูตำแหน่งในรูป
              </p>

              <div className="grid grid-cols-6 sm:grid-cols-7 md:grid-cols-9 gap-2 pb-5">
                {pickedColors.map((c, index) => (
                  <div
                    key={`${c.hex}-${index}`}
                    className="relative group"
                    onMouseEnter={() => setHighlightedHex(c.hex)}
                    onMouseLeave={() => setHighlightedHex(null)}
                  >
                    <div
                      className={`aspect-square rounded-lg border-2 shadow-sm cursor-pointer transition-all group-hover:scale-110 group-hover:shadow-md ${
                        highlightedHex === c.hex
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-200 group-hover:border-gray-300"
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.hex}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(c.hex)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 hover:scale-110 transition-all z-20"
                      aria-label={`ลบสี ${c.hex}`}
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {c.hex}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add All Button */}
              <button
                type="button"
                onClick={handleAddAllColors}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2.5 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 active:scale-[0.99] transition-all font-medium shadow-sm flex items-center justify-center gap-2"
                aria-label="เพิ่มสีทั้งหมดลงในแคตตาล็อก"
              >
                <Check className="w-4 h-4" />
                เพิ่ม {pickedColors.length} สีลงในแคตตาล็อก
              </button>

              {pickedColors.length < maxColors && (
                <p className="text-xs text-gray-500 text-center">
                  คลิกบนรูปเพิ่มสีได้อีก {maxColors - pickedColors.length} สี
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
