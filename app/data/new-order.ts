import type {
	CheckoutSummaryItem,
	PlacedOrderAddress,
	PlacedOrderDeliveryType,
	PlacedOrderSummaryItem,
	PlacedOrderTimelineItem,
	ServiceConfig,
} from "../types/new-order";

export const logisticsFee = 50;

export const services: ServiceConfig[] = [
	{
		id: "wash-fold",
		label: "Wash & Fold",
		description: "Standard washing with professional detergents, neatly folded and sorted.",
		unitLabel: "kg",
		inputLabel: "Estimated Weight:",
		placeholder: "0",
		price: 35,
		iconName: "waves",
	},
	{
		id: "quick-dry",
		label: "Quick Dry",
		description: "Industrial tumble drying for extra fluffiness and fast turnaround.",
		unitLabel: "kg",
		inputLabel: "Estimated Weight:",
		placeholder: "0",
		price: 25,
		iconName: "sun",
	},
	{
		id: "press-iron",
		label: "Press & Iron",
		description: "Hand-pressed ironing for shirts, dresses, and formal wear.",
		unitLabel: "pc",
		inputLabel: "Estimated Quantity:",
		placeholder: "0",
		price: 15,
		iconName: "flame",
	},
];

export const checkoutTimeSlots = [
	"09:00 AM - 11:00 AM",
	"11:00 AM - 01:00 PM",
	"01:00 PM - 03:00 PM",
	"03:00 PM - 05:00 PM",
	"05:00 PM - 07:00 PM",
];

export const checkoutSummaryItems: CheckoutSummaryItem[] = [
	{ id: "wash-fold", label: "Full Service Wash & Fold", unit: "5.0 kg", amount: 175 },
	{ id: "ironing", label: "Ironing Service", unit: "12 pcs", amount: 180 },
	{ id: "delicate", label: "Delicate Care Add on", unit: "2 items", amount: 100 },
];

export const checkoutPromoDiscount = 50;

export const placedOrderId = "#WW-99210";

export const placedPaymentMethod = "Payment: COD";

export const placedOrderSummaryItems: PlacedOrderSummaryItem[] = [
	{ id: "wash-dry", service: "Wash & Dry (Full Load)", quantity: "7.5 kg", amount: 262.5 },
	{ id: "steam-ironing", service: "Steam Ironing", quantity: "12 pcs", amount: 180 },
	{ id: "detergent-upgrade", service: "Detergent Upgrade (Ariel)", quantity: "1", amount: 25 },
	{ id: "pickup-delivery", service: "Pickup & Delivery Fee", quantity: "Standard", amount: 50 },
];

export const placedPickupAddress: PlacedOrderAddress = {
	name: "Chesca",
	address: "123 Street, Olongapo",
};

export const placedDeliveryType: PlacedOrderDeliveryType = {
	label: "Express Door-to-Door",
	notes: ["Same-day processing enabled.", "Delicate handling requested."],
};

export const placedExpectedTimeline: PlacedOrderTimelineItem[] = [
	{
		id: "pickup",
		title: "Pickup",
		description: "Today, Between 2:00 PM - 4:00 PM",
		isCurrent: true,
	},
	{
		id: "return-delivery",
		title: "Return Delivery",
		description: "Tomorrow, Expected by 5:00 PM",
	},
];
