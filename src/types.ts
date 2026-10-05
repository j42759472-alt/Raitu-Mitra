export type UserRole = 'farmer' | 'laborer' | 'business';

export type HireStatus = 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled' | 'paid';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export type PaymentMethod = 'upi' | 'bank_transfer' | 'cash' | 'razorpay' | 'cashfree';

export type NotificationType =
  | 'hire_request' | 'hire_accepted' | 'hire_rejected'
  | 'work_started' | 'work_completed' | 'payment_received'
  | 'new_message' | 'new_rating' | 'system';

export type EquipmentStatus = 'available' | 'rented' | 'maintenance' | 'unavailable';

export type BookingStatus = 'pending' | 'confirmed' | 'in_use' | 'returned' | 'cancelled';

export type Language = 'en' | 'te';

export interface Profile {
  id: string;
  phone: string;
  full_name: string;
  role: UserRole;
  preferred_language: Language;
  skills?: string[];
  avatar_url?: string;
  address?: string;
  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
  pincode?: string;
  location?: { lat: number; lng: number };
  avg_rating: number;
  total_ratings: number;
  total_jobs_completed: number;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Skill {
  id: string;
  name: string;
  name_te?: string;
  category_id: string;
}

export interface UserSkill {
  id: string;
  user_id: string;
  skill_id: string;
  proficiency: 'beginner' | 'intermediate' | 'expert';
  skill?: Skill;
}

export interface HireRequest {
  id: string;
  buyer_id: string;
  worker_id: string;
  title: string;
  description?: string;
  required_skills?: string[];
  work_address?: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  estimated_hours?: number;
  offered_wage: number;
  wage_type: 'daily' | 'hourly' | 'fixed';
  includes_food: boolean;
  includes_transport: boolean;
  status: HireStatus;
  created_at: string;
}

export interface Payment {
  id: string;
  hire_request_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  platform_fee?: number;
  net_amount?: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  paid_at?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface Equipment {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  equipment_type: string;
  brand?: string;
  model?: string;
  photos?: string[];
  daily_rate: number;
  hourly_rate?: number;
  with_operator: boolean;
  operator_charge?: number;
  location_address?: string;
  status: EquipmentStatus;
  avg_rating: number;
  total_ratings: number;
}
