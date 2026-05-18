export type PulseMetricAccent =
  | "primary"
  | "warning"
  | "secondary"
  | "info"
  | "success"
  | "neutral";

export type PulseMetricIconName = "washing" | "drying" | "ironing" | "to-deliver" | "ready" | "completed";

export type PulseMetric = {
  id: string;
  label: string;
  value: number;
  icon: PulseMetricIconName;
  accent: PulseMetricAccent;
};

export type ActivityStatus = "Processing" | "In Transit" | "Ready" | "Completed";

export type Activity = {
  id: string;
  service: string;
  orderNumber: string;
  date: string;
  amount: string;
  status: ActivityStatus;
};

export type AdminStatCard = {
  id: string;
  label: string;
  value: number;
  icon: "users" | "orders" | "items";
  accent: "primary" | "info" | "success";
};

export type DashboardAnalyticsTrendDirection = "up" | "down";

export type DashboardAnalyticsMetric = {
  id: string;
  label: string;
  value: string;
  trend?: string;
  trendDirection?: DashboardAnalyticsTrendDirection;
  note?: string;
};

export type AdminQuickStat = {
  id: string;
  label: string;
  value: number;
};

export type ActivityStatIcon = "completed" | "alerts" | "deliveries" | "total";

export type ActivityStatColor = "success" | "warning" | "info" | "primary";

export type ActivityStat = {
  id: string;
  label: string;
  value: number;
  icon: ActivityStatIcon;
  color: ActivityStatColor;
};

export type OrderStatus = "waiting" | "in-progress" | "ready" | "out-for-delivery" | "closed";

export type LiveOrder = {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  items: number;
  amount: string;
  status: OrderStatus;
  serviceMethod?: string;
  orderTime: string;
  estimatedCompletion: string;
  paymentStatus?: "unpaid" | "partially_paid" | "paid" | "refunded";
};

export type ProgressStatIcon = "active" | "completed" | "processing" | "ready";

export type ProgressStatColor = "primary" | "success" | "warning" | "info";

export type ProgressStat = {
  id: string;
  label: string;
  value: number;
  color: ProgressStatColor;
  icon: ProgressStatIcon;
};

export type ReportMetricIcon = "revenue" | "orders" | "customers" | "views";

export type ReportMetric = {
  id: string;
  label: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  icon: ReportMetricIcon;
};

export type ServiceReport = {
  id: string;
  name: string;
  orders: number;
  revenue: string;
  average: string;
  growth: string;
};

export type UserStatus = "active" | "inactive" | "suspended";

export type UserAccount = {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  orders: number;
  status: UserStatus;
  totalSpent: string;
};

export type UserStatColor = "primary" | "success" | "warning" | "error";

export type UserStat = {
  id: string;
  label: string;
  value: number;
  color: UserStatColor;
};

export type ActivityLog = {
  id: string;
  type: "order-received" | "order-completed" | "delivery-completed" | "order-delayed";
  orderCode: string;
  customerName: string;
  quantity: number;
  performedBy: string;
  minutesAgo: number;
};


