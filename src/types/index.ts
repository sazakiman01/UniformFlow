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
  deliveryDateRange: {
    start: Date;
    end: Date;
  };
  channel: 'L' | 'F' | 'OTHER';
  totalAmount: number;
  paidAmount: number;
  discountAmount: number;
  status: OrderStatus;
  paymentVerified: boolean;
  emailCheckLink?: string;
  notificationSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus = 'pending' | 'confirmed' | 'production' | 'ready' | 'shipped' | 'completed';

// Order Item
export interface OrderItem {
  id: string;
  orderId: string;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specifications: {
    size?: string;
    color?: string;
    customNotes?: string;
    logoImage?: string;
  };
  createdAt: Date;
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
