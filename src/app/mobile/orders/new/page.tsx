"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { generateOrderNumber } from "@/lib/utils";
import { ArrowLeft, Upload, X } from "lucide-react";
import Link from "next/link";

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Customer
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  // Order
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [notes, setNotes] = useState("");
  const [channel, setChannel] = useState<"L" | "F" | "OTHER">("L");

  // Image
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("ไฟล์ต้องมีขนาดไม่เกิน 5MB");
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview("");
  };

  const totalAmount = quantity * unitPrice;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Create customer
      const customerRef = await addDoc(collection(db, "customers"), {
        name: customerName,
        phone: customerPhone,
        address: {
          street: "",
          district: "",
          province: "",
          postcode: "",
          fullAddress: customerAddress,
        },
        channel,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // 2. Upload image if exists
      let imageUrl = "";
      if (image) {
        const imageRef = ref(storage, `orders/${Date.now()}_${image.name}`);
        const snapshot = await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      // 3. Create order
      const orderNumber = generateOrderNumber();
      const orderRef = await addDoc(collection(db, "orders"), {
        customerId: customerRef.id,
        orderNumber,
        channel,
        totalAmount,
        paidAmount: 0,
        discountAmount: 0,
        status: "pending",
        paymentVerified: false,
        notificationSent: false,
        deliveryDateRange: {
          start: Timestamp.now(),
          end: Timestamp.now(),
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // 4. Create order item
      await addDoc(collection(db, "orderItems"), {
        orderId: orderRef.id,
        productName,
        description: notes,
        quantity,
        unitPrice,
        totalPrice: totalAmount,
        specifications: {
          customNotes: notes,
          logoImage: imageUrl,
        },
        createdAt: Timestamp.now(),
      });

      router.push(`/mobile/orders/${orderRef.id}`);
    } catch (err: any) {
      console.error(err);
      setError("เกิดข้อผิดพลาด: " + (err.message || "กรุณาลองใหม่"));
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/mobile/orders" className="p-2 -ml-2 text-gray-600">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h2 className="text-xl font-bold text-gray-900">สร้างออเดอร์ใหม่</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Section */}
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
          <h3 className="font-semibold text-gray-900">ข้อมูลลูกค้า</h3>

          <div>
            <label className="block text-sm text-gray-700 mb-1">ชื่อลูกค้า *</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">เบอร์โทร *</label>
            <input
              type="tel"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">ที่อยู่จัดส่ง</label>
            <textarea
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">ช่องทาง</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as "L" | "F" | "OTHER")}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="L">LINE</option>
              <option value="F">Facebook</option>
              <option value="OTHER">อื่นๆ</option>
            </select>
          </div>
        </div>

        {/* Order Section */}
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
          <h3 className="font-semibold text-gray-900">รายละเอียดสินค้า</h3>

          <div>
            <label className="block text-sm text-gray-700 mb-1">ชื่อสินค้า *</label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="เช่น เสื้อโปโลปักโลโก้"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">จำนวน *</label>
              <input
                type="number"
                required
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">ราคา/หน่วย *</label>
              <input
                type="number"
                required
                min={0}
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-gray-700">ยอดรวม</span>
            <span className="text-lg font-bold text-blue-600">
              {totalAmount.toLocaleString()} ฿
            </span>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">หมายเหตุ</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="รายละเอียดเพิ่มเติม เช่น สี ไซส์ โลโก้"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">รูปโลโก้/ตัวอย่าง</label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">แตะเพื่ออัปโหลดรูป</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "กำลังบันทึก..." : "บันทึกออเดอร์"}
        </button>
      </form>
    </div>
  );
}
