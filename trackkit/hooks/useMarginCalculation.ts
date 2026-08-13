export interface MarginResult {
  marginPercent: number | null;
  marginAmount: number | null;
  status: "green" | "yellow" | "red";
}

export interface MarginInputObj {
  costPerUnit?: number | null;
  sellingPricePerUnit?: number | null;
}

/**
 * Calculates profit margin percentage, amount, and color status.
 * Supports both:
 * 1. Object argument: calculateMargin({ costPerUnit: 500, sellingPricePerUnit: 750 })
 * 2. Positional arguments: calculateMargin(500, 750)
 */
export function calculateMargin(
  arg1: number | null | undefined | MarginInputObj,
  arg2?: number | null | undefined
): MarginResult {
  let cost: number | null = null;
  let selling: number | null = null;

  if (typeof arg1 === "object" && arg1 !== null) {
    cost = arg1.costPerUnit ?? null;
    selling = arg1.sellingPricePerUnit ?? null;
  } else {
    cost = arg1 ?? null;
    selling = arg2 ?? null;
  }

  if (cost === null || cost === undefined || cost <= 0 || selling === null || selling === undefined) {
    return {
      marginPercent: null,
      marginAmount: null,
      status: "red",
    };
  }

  const marginAmount = selling - cost;
  const marginPercent = Math.round((marginAmount / cost) * 100);

  let status: "green" | "yellow" | "red" = "red";
  if (marginPercent > 30) {
    status = "green";
  } else if (marginPercent >= 10) {
    status = "yellow";
  } else {
    status = "red";
  }

  return {
    marginPercent,
    marginAmount,
    status,
  };
}

/**
 * Suggests target selling price for a given cost and target margin percentage.
 */
export function suggestTargetPrice(
  costPerUnit: number | null | undefined,
  targetMarginPercent: number = 30
): number | null {
  if (costPerUnit === null || costPerUnit === undefined || costPerUnit <= 0) {
    return null;
  }
  const suggested = costPerUnit * (1 + targetMarginPercent / 100);
  return Math.round(suggested);
}

/**
 * Returns color-coded status ('green' | 'yellow' | 'red') based on margin percent.
 */
export function getMarginStatus(marginPercent: number | null | undefined): "green" | "yellow" | "red" {
  if (marginPercent === null || marginPercent === undefined) {
    return "red";
  }
  if (marginPercent > 30) {
    return "green";
  }
  if (marginPercent >= 10) {
    return "yellow";
  }
  return "red";
}

export function useMarginCalculation() {
  return {
    calculateMargin,
    suggestTargetPrice,
    getMarginStatus,
  };
}
