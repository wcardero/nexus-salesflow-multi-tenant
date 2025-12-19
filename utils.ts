// utils.ts
import { Store, Product, ExchangeRate } from "./types";

/**
 * Obtiene el tipo de cambio vigente para una tienda.
 * @param store La tienda.
 * @returns El tipo de cambio activo.
 */
export const getCurrentExchangeRate = (store: Store): ExchangeRate | undefined => {
  return store.exchangeRates.find(xr => !xr.endDate);
};

/**
 * Calcula los precios de un producto basándose en el tipo de cambio actual.
 * @param product El producto a calcular.
 * @param exchangeRate El tipo de cambio a utilizar.
 * @param commissionRate La tasa de comisión a aplicar.
 * @returns Un objeto con todos los precios calculados.
 */
export const calculateProductPrices = (
  product: Product, 
  exchangeRate: ExchangeRate, 
  commissionRate: number
) => {
  if (!exchangeRate) {
    return { saleUSD: 0, baseMN: 0, commission: 0, finalMN: 0 };
  }

  const saleUSD = product.costUSD * (1 + product.margin);
  const baseMN = saleUSD * exchangeRate.rate;
  const commission = baseMN * commissionRate;
  const finalMN = baseMN + commission;

  return {
    saleUSD,
    baseMN,
    commission,
    finalMN,
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