/**
 * pricing.ts
 *
 * Industry-standard pricing calculation utilities for WashWise orders.
 * Ensures consistent cost calculation across backend and frontend.
 *
 * Formula: finalTotal = subtotal + logisticsFee - promoDiscount - loyaltyDiscount
 * where subtotal = sum(service.price * service.quantity for each service)
 */

export interface PricingInput {
	subtotal: number;
	logisticsFee: number;
	promoDiscount?: number;
	loyaltyDiscount?: number;
}

export interface PricingBreakdown extends PricingInput {
	finalTotal: number;
}

/**
 * Calculates final total cost with all discounts applied.
 *
 * @param input - Pricing components
 * @returns Complete pricing breakdown including final total
 *
 * @example
 * ```typescript
 * const breakdown = calculateFinalCost({
 *   subtotal: 500,
 *   logisticsFee: 50,
 *   promoDiscount: 50,
 *   loyaltyDiscount: 20
 * });
 * // { subtotal: 500, logisticsFee: 50, promoDiscount: 50, loyaltyDiscount: 20, finalTotal: 480 }
 * ```
 */
export function calculateFinalCost(input: PricingInput): PricingBreakdown {
	const promoDiscount = input.promoDiscount || 0;
	const loyaltyDiscount = input.loyaltyDiscount || 0;

	const finalTotal = input.subtotal + input.logisticsFee - promoDiscount - loyaltyDiscount;

	return {
		subtotal: input.subtotal,
		logisticsFee: input.logisticsFee,
		promoDiscount,
		loyaltyDiscount,
		finalTotal: Math.max(0, finalTotal), // Ensure non-negative total
	};
}

/**
 * Validates that the provided final total matches the calculated value.
 * Uses a small tolerance (±0.01) for floating point precision.
 *
 * @param provided - Client-provided final total
 * @param calculated - Server-calculated final total
 * @param tolerance - Allowed deviation in peso (default: 0.01)
 * @returns true if totals match within tolerance
 */
export function validateFinalCost(
	provided: number,
	calculated: number,
	tolerance: number = 0.01
): boolean {
	return Math.abs(provided - calculated) <= tolerance;
}

/**
 * Formats pricing breakdown for logging and debugging.
 * Useful for activity records and audit trails.
 *
 * @param breakdown - Pricing breakdown
 * @returns Human-readable string
 */
export function formatPricingBreakdown(breakdown: PricingBreakdown): string {
	return (
		`Subtotal: ₱${breakdown.subtotal.toFixed(2)} ` +
		`+ Logistics: ₱${breakdown.logisticsFee.toFixed(2)} ` +
		`- Promo: ₱${breakdown.promoDiscount.toFixed(2)} ` +
		`- Loyalty: ₱${breakdown.loyaltyDiscount.toFixed(2)} ` +
		`= Total: ₱${breakdown.finalTotal.toFixed(2)}`
	);
}
