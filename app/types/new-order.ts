export type ServiceKey = string;

export type ServiceIconName = string;

/**
 * Payment Status Enum - Industry standard payment lifecycle tracking.
 * Follows ISO 20022 payment status conventions and common e-commerce standards.
 */
export type PaymentStatus = "unpaid" | "partially_paid" | "paid" | "refunded";

export type Service = {
	_id?: string;
	id: ServiceKey;
	label: string;
	description: string;
	unitLabel: "kg" | "pc";
	inputLabel: string;
	placeholder: string;
	price: number;
	iconName: ServiceIconName;
	createdAt?: string;
	updatedAt?: string;
};

export type ServiceConfig = Service;

export type ServiceMethod = "pickup" | "dropoff";

export type CheckoutSummaryItem = {
	id: string;
	label: string;
	unit: string;
	amount: number;
};

export type PlacedOrderSummaryItem = {
	id: string;
	service: string;
	quantity: string;
	amount: number;
};

export type PlacedOrderTimelineItem = {
	id: string;
	title: string;
	description: string;
	isCurrent?: boolean;
};

export type PlacedOrderAddress = {
	name: string;
	address: string;
};

export type PlacedOrderDeliveryType = {
	label: string;
	notes: string[];
};

export type OrderServiceItem = {
	id: ServiceKey;
	quantity: number;
	lineTotal: number;
	label: string;
	unitLabel: string;
};

export type CreateOrderRequest = {
	services: OrderServiceItem[];
	specialInstructions: string;
	subtotal: number;
};

export type CreateOrderResponse = {
	success: boolean;
	orderId?: string;
	error?: string;
};

export type FetchOrderResponse = {
	success: boolean;
	order?: {
		_id: string;
		userId: string;
		services: OrderServiceItem[];
		specialInstructions: string;
		subtotal: number;
		status: string;
		createdAt: string;
		/** Computed total weight (kg) for services that use kg as unit */
		totalWeight?: number;
		/** Payment status tracking — industry standard lifecycle */
		paymentStatus: PaymentStatus;
		/** Loyalty discount applied (in peso amount) */
		loyaltyDiscount?: number;
		/** Handover timestamps (ISO) */
		pickedUpAt?: string | null;
		receivedByStaffAt?: string | null;
		receivedByClientAt?: string | null;
	};
	error?: string;
};

export type CreateCheckoutRequest = {
	orderId: string;
	serviceMethod: ServiceMethod;
	streetAddress?: string;
	barangay?: string;
	city?: string;
	selectedSlot?: string;
	paymentMethod?: string;
	logisticsFee: number;
	promoDiscount: number;
	/** Loyalty discount applied in peso amount */
	loyaltyDiscount?: number;
	finalTotal: number;
};

export type CreateCheckoutResponse = {
	success: boolean;
	transactionId?: string;
	error?: string;
};

export type FetchTransactionResponse = {
	success: boolean;
	transaction?: {
		_id: string;
		orderId: string;
		userId: string;
		serviceMethod: ServiceMethod;
		streetAddress: string;
		barangay: string;
		city: string;
		selectedSlot: string;
		paymentMethod: string;
		logisticsFee: number;
		promoDiscount: number;
		rewardId?: string | null;
		finalTotal: number;
		createdAt: string;
		/** Payment status at transaction time */
		paymentStatus?: PaymentStatus;
		order?: {
			_id: string;
			services: OrderServiceItem[];
			specialInstructions: string;
			subtotal: number;
			status: string;
			/** Computed total weight (kg) for services that use kg as unit */
			totalWeight?: number;
			/** Payment status tracking */
			paymentStatus?: PaymentStatus;
			/** Loyalty discount applied (peso) */
			loyaltyDiscount?: number;
			pickedUpAt?: string | null;
			receivedByStaffAt?: string | null;
			receivedByClientAt?: string | null;
		};
	};
	error?: string;
};

export interface PaginationData {
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export type FetchTransactionsResponse = {
	success: boolean;
	transactions?: Array<{
		_id: string;
		orderId: string;
		userId: string;
		serviceMethod: ServiceMethod;
		streetAddress: string;
		barangay: string;
		city: string;
		selectedSlot: string;
		paymentMethod: string;
		logisticsFee: number;
		promoDiscount: number;
		rewardId?: string | null;
		finalTotal: number;
		createdAt: string;
		/** Payment status at transaction time */
		paymentStatus?: PaymentStatus;
		order?: {
			_id: string;
			services: OrderServiceItem[];
			specialInstructions: string;
			subtotal: number;
			status: string;
			/** Computed total weight (kg) for services that use kg as unit */
			totalWeight?: number;
			/** Payment status tracking */
			paymentStatus?: PaymentStatus;
			/** Loyalty discount applied (peso) */
			loyaltyDiscount?: number;
