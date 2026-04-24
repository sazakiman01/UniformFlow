// User (Firestore mirror of Firebase Auth + metadata)
export type UserRole = 'admin' | 'user';

export interface UserProfile {
  id: string;              // Firebase Auth uid
  email: string;
  displayName?: string;
  role: UserRole;
  disabled: boolean;
  lineUserId?: string;     // Phase 2
  invitedBy?: string;      // uid of admin who invited
  createdAt: Date;
  updatedAt: Date;
}

// Invite
export type InviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export interface Invite {
  id: string;
  email: string;
  role: UserRole;
  token: string;           // 32-char random
  status: InviteStatus;
  expiresAt: Date;
  createdBy: string;       // admin uid
  createdAt: Date;
  acceptedAt?: Date;
  acceptedBy?: string;     // user uid
}

// Customer
export interface Customer {
  id: string;
  name: string;
  phone: string;
  lineUserId?: string;
  address: Address;
  channel: 'L' | 'F' | 'OTHER';
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  district: string;
  province: string;
  postcode: string;
  fullAddress: string;
}

// Order
export interface Order {
  id: string;
  customerId: string;
  orderNumber: string;
  transferDate?: Date;
  deliveryDateRange?: {
    start: Date;
    end: Date;
  };
  channel: 'L' | 'F' | 'OTHER';
  items: OrderItem[];
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  discountAmount?: number;
  receiptInfo?: ReceiptInfo;
  status: OrderStatus;
  paymentVerified: boolean;
  emailCheckLink?: string;
  notificationSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus = 'pending' | 'confirmed' | 'production' | 'ready' | 'shipped' | 'completed';

// Order Item (embedded in Order.items array)
export interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
  specifications?: {
    size?: string;
    color?: string;
    customNotes?: string;
    logoImage?: string;
  };
}

// Receipt Info
export interface ReceiptInfo {
  name?: string;
  address?: string;
  phone?: string;
}

// Production
export interface Production {
  id: string;
  orderId: string;
  tailorId: string;
  status: ProductionStatus;
  fabricReady: boolean;
  fabricNote: string;
  productionDetails: ProductionDetails;
  progress: number; // 0-100
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductionStatus = 'assigned' | 'in_progress' | 'completed' | 'delayed';

export interface ProductionDetails {
  logoImage?: string;
  detailImage?: string;
  printDetails?: string;
  threadColor?: string;
  customInstructions?: string;
}

// Tailor
export interface Tailor {
  id: string;
  name: string;
  phone: string;
  specialties: string[];
  active: boolean;
  monthlyProduction: number;
  createdAt: Date;
  updatedAt: Date;
}

// Inventory
export interface Inventory {
  id: string;
  fabricType: string;
  fabricCode: string;
  color: string;
  quantity: number;
  unit: string;
  supplier: string;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

// Payment
export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: 'transfer' | 'cash' | 'other';
  transferDate?: Date;
  slipImage?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
}

// Notification
export interface Notification {
  id: string;
  orderId: string;
  type: NotificationType;
  recipient: string;
  message: string;
  sent: boolean;
  sentAt?: Date;
  scheduledFor?: Date;
  createdAt: Date;
}

export type NotificationType = 'payment_reminder' | 'delivery_reminder' | 'production_update';
