
export const calculateProductPrices = (
  costUsd: number, 
  marginPct: number, 
  exchangeRate: number, 
  commissionPct: number
) => {
  const ventaUsd = costUsd * (1 + marginPct);
  const mnBase = ventaUsd * exchangeRate;
  const comision = mnBase * commissionPct;
  const mnFinal = mnBase + comision;

  return {
    ventaUsd,
    mnBase,
    comision,
    mnFinal
  };
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value);
};
