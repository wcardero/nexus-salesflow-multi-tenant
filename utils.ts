// utils.ts
import { Store, Product, ExchangeRate } from "./types";

/**
 * Obtiene el tipo de cambio vigente para una tienda.
 * @param store La tienda.
 * @returns El tipo de cambio activo.
 */
export const getCurrentExchangeRate = (store: Store): ExchangeRate | undefined => {
  if (!store.exchangeRates || store.exchangeRates.length === 0) return undefined;

  const now = new Date();
  const rates = store.exchangeRates
    .map(xr => ({ ...xr, startDate: new Date(xr.startDate), endDate: xr.endDate ? new Date(xr.endDate) : undefined }))
    .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

  const activeRate = rates.find(xr => xr.startDate <= now && (!xr.endDate || xr.endDate > now));
  if (activeRate) return activeRate;

  return rates[0];
};

/**
 * Calcula los precios de un producto basándose en el tipo de cambio actual y la moneda del costo.
 * @param product El producto a calcular.
 * @param exchangeRate El tipo de cambio a utilizar (solo para productos en USD).
 * @returns Un objeto con todos los precios calculados.
 */
export const calculateProductPrices = (
  product: Product,
  exchangeRate: ExchangeRate | undefined
) => {
  if (product.commissionRate === undefined || product.commissionRate === null) {
    return { saleUSD: 0, baseMN: 0, commission: 0, finalMN: 0, priceMN: 0, gestorCommissionMN: 0 };
  }

  if (product.currency === 'MN') {
    const costMN = product.costMN || 0;
    const baseMN = costMN * (1 + product.margin);
    const gestorCommissionMN = baseMN * product.commissionRate;
    const finalMN = baseMN + gestorCommissionMN;

    return {
      saleUSD: 0,
      baseMN,
      commission: gestorCommissionMN,
      finalMN,
      priceMN: finalMN,
      gestorCommissionMN,
    };
  }

  if (!exchangeRate) {
    return { saleUSD: 0, baseMN: 0, commission: 0, finalMN: 0, priceMN: 0, gestorCommissionMN: 0 };
  }

  const costUSD = product.costUSD || 0;
  const saleUSD = costUSD * (1 + product.margin);
  const baseMN = saleUSD * exchangeRate.rate;
  const gestorCommissionMN = baseMN * product.commissionRate;
  const finalMN = baseMN + gestorCommissionMN;

  return {
    saleUSD,
    baseMN,
    commission: gestorCommissionMN,
    finalMN,
    priceMN: finalMN,
    gestorCommissionMN,
  };
};

/**
 * Formatea un número como moneda.
 * @param amount La cantidad a formatear.
 * @returns El string formateado.
 */
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS', // Usando ARS como ejemplo para MN
  }).format(amount);
};
