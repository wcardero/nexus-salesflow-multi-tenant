// utils.ts
import { Store, Product, ExchangeRate } from "./types";

/**
 * Obtiene el tipo de cambio vigente para una tienda.
 * @param store La tienda.
 * @returns El tipo de cambio activo.
 */
export const getCurrentExchangeRate = (store: Store): ExchangeRate | undefined => {
  // Cuando los datos vienen de la API como JSON, las fechas son strings.
  // Nos aseguramos de que se manejen como objetos Date para la comparación.
  const now = new Date();
  return store.exchangeRates
    .map(xr => ({ ...xr, startDate: new Date(xr.startDate), endDate: xr.endDate ? new Date(xr.endDate) : undefined }))
    .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
    .find(xr => xr.startDate <= now && (!xr.endDate || xr.endDate > now));
};

/**
 * Obtiene la tasa de comisión a aplicar para un producto.
 * Si el producto tiene una comisión específica, la usa.
 * Si no, usa la comisión por defecto de la tienda.
 * @param product El producto.
 * @param store La tienda.
 * @returns La tasa de comisión a aplicar.
 */
export const getCommissionRateForProduct = (product: Product, store: Store): number => {
  if (product.commissionRate !== undefined && product.commissionRate !== null) {
    return product.commissionRate;
  }
  return store.defaultCommissionRate;
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
  exchangeRate: ExchangeRate | undefined, 
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
