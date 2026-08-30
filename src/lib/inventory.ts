export type DemandForecast = {
  skuId: string;
  velocity: number;
  stockoutDate: string;
  recommendedOrderQuantity: number;
  confidence: number;
};

/** Weighted recent velocity with a simple linear trend for a fast client-side forecast. */
export function forecastSkuDemand(skuId: string, historicalUnits: number[], historicalDays = historicalUnits.length): DemandForecast {
  const values = historicalUnits.slice(-historicalDays);
  if (!values.length) throw new Error("At least one sales observation is required");
  const recent = values.slice(-7);
  const velocity = recent.reduce((sum, value) => sum + value, 0) / recent.length;
  const prior = values.slice(0, Math.max(1, values.length - recent.length));
  const priorVelocity = prior.reduce((sum, value) => sum + value, 0) / prior.length;
  const trend = priorVelocity ? Math.max(0.65, Math.min(1.8, velocity / priorVelocity)) : 1;
  const adjustedVelocity = velocity * trend;
  const availableUnits = 184;
  const leadTimeDays = 12;
  const safetyStock = 240;
  const stockout = new Date(Date.now() + (availableUnits / adjustedVelocity) * 86400000);
  return { skuId, velocity: +adjustedVelocity.toFixed(2), stockoutDate: stockout.toISOString(), recommendedOrderQuantity: Math.ceil(Math.max(0, adjustedVelocity * leadTimeDays + safetyStock - availableUnits)), confidence: +Math.min(0.99, 0.78 + values.length / 200).toFixed(3) };
}

export type PurchaseOrderItem = { skuId: string; name: string; quantity: number; unitPrice: number };

export function generatePurchaseOrder(supplierId: string, items: PurchaseOrderItem[]) {
  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const csv = ["sku_id,product,quantity,unit_price,line_total", ...items.map((item) => `${item.skuId},"${item.name.replaceAll('"', '""')}",${item.quantity},${item.unitPrice.toFixed(2)},${(item.quantity * item.unitPrice).toFixed(2)}`), `,,,TOTAL,${total.toFixed(2)}`].join("\n");
  return { supplierId, total: +total.toFixed(2), csv, createdAt: new Date().toISOString() };
}
