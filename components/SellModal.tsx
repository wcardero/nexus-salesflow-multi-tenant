// components/SellModal.tsx
import React from 'react';
import { Product, InventoryGroup, SalePaymentStatus, PaymentMethod } from '../types';
import { formatCurrency } from '../utils';
import Button from './Button';

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSell: (quantity: number, paymentStatus: SalePaymentStatus, paymentMethod: PaymentMethod, transferSurchargePercent: number, customerName?: string) => void;
  product: Product | null;
  inventoryGroup: InventoryGroup | null;
  storeCommissionRate?: number;
}

const SellModal: React.FC<SellModalProps> = ({ isOpen, onClose, onSell, product, inventoryGroup, storeCommissionRate = 0.1 }) => {
  const [quantity, setQuantity] = React.useState(1);
  const [paymentStatus, setPaymentStatus] = React.useState<SalePaymentStatus>(SalePaymentStatus.PAID);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>(PaymentMethod.CASH);
  const [transferSurchargePercent, setTransferSurchargePercent] = React.useState<number>(0);
  const [customerName, setCustomerName] = React.useState('');
  const [isSelling, setIsSelling] = React.useState(false);

  const calculation = React.useMemo(() => {
    if (!product) return null;
    
    const cost = product.costMN || 0;
    const margin = product.margin || 0;
    const commissionRate = product.commissionRate || storeCommissionRate;
    
    const base = cost * (1 + margin);
    const commission = base * commissionRate;
    const subtotal = base + commission;
    
    let surchargeAmount = 0;
    let finalTotal = subtotal;
    
    if (paymentMethod === PaymentMethod.TRANSFER && transferSurchargePercent > 0) {
      surchargeAmount = subtotal * (transferSurchargePercent / 100);
      finalTotal = subtotal + surchargeAmount;
    }
    
    return {
      base,
      commission,
      subtotal,
      surchargeAmount,
      finalTotal,
      gestorGets: commission,
      storeGets: base + surchargeAmount
    };
  }, [product, paymentMethod, transferSurchargePercent, storeCommissionRate]);

  const handleSell = async () => {
    setIsSelling(true);
    try {
      await onSell(
        quantity, 
        paymentStatus, 
        paymentMethod,
        transferSurchargePercent,
        paymentStatus === SalePaymentStatus.PENDING ? customerName : undefined
      );
    } finally {
      setIsSelling(false);
    }
  };

  if (!isOpen || !product || !inventoryGroup) return null;

  return (
     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-label="Vender Producto">
       <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg shadow-xl w-full max-w-md">
         <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4">Vender Producto</h3>
         <p className="text-sm md:text-base">Producto: {product.name}</p>
         <p className="text-sm md:text-base">Disponibles: {inventoryGroup.quantity}</p>
          <div className="my-3 md:my-4">
            <label htmlFor="quantity" className="block text-xs md:text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">
              Cantidad a vender
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              min="1"
              max={inventoryGroup.quantity}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs md:text-sm dark:bg-slate-700 dark:border-slate-600 py-2 px-3"
            />
          </div>

          <div className="my-3 md:my-4">
            <label className="block text-xs md:text-sm font-medium text-slate-700 dark:text-slate-400 mb-2">
              Tipo de pago
            </label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={PaymentMethod.CASH}
                  checked={paymentMethod === PaymentMethod.CASH}
                  onChange={() => {
                    setPaymentMethod(PaymentMethod.CASH);
                    setPaymentStatus(SalePaymentStatus.PAID);
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Pago al contado (efectivo)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={PaymentMethod.TRANSFER}
                  checked={paymentMethod === PaymentMethod.TRANSFER}
                  onChange={() => {
                    setPaymentMethod(PaymentMethod.TRANSFER);
                    setPaymentStatus(SalePaymentStatus.PAID);
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Pago por transferencia</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={PaymentMethod.CREDIT}
                  checked={paymentMethod === PaymentMethod.CREDIT}
                  onChange={() => {
                    setPaymentMethod(PaymentMethod.CREDIT);
                    setPaymentStatus(SalePaymentStatus.PENDING);
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Venta al crédito</span>
              </label>
            </div>
          </div>

          {paymentMethod === PaymentMethod.TRANSFER && (
            <div className="my-3 md:my-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <label htmlFor="transferSurcharge" className="block text-xs md:text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                % Recargo por transferencia
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="transferSurcharge"
                  min="0"
                  max="100"
                  step="0.1"
                  value={transferSurchargePercent}
                  onChange={(e) => setTransferSurchargePercent(Number(e.target.value))}
                  className="block w-24 rounded-md border-blue-300 dark:border-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs md:text-sm dark:bg-slate-700 py-2 px-3"
                  placeholder="Ej: 3"
                />
                <span className="text-blue-800 dark:text-blue-200 font-medium">%</span>
              </div>
              <p className="mt-2 text-xs text-blue-600 dark:text-blue-300">
                Este recargo se suma a la ganancia de la tienda
              </p>
            </div>
          )}

          {paymentStatus === SalePaymentStatus.PENDING && (
            <div className="my-3 md:my-4">
              <label htmlFor="customerName" className="block text-xs md:text-sm font-medium text-slate-700 dark:text-slate-400 mb-1">
                Nombre y apellidos del cliente *
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Juan Pérez"
                className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs md:text-sm dark:bg-slate-700 dark:border-slate-600 py-2 px-3"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 flex-wrap mt-4 md:mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </button>
            <Button
              type="button"
              onClick={handleSell}
              isLoading={isSelling}
              disabled={quantity <= 0 || quantity > inventoryGroup.quantity || (paymentStatus === SalePaymentStatus.PENDING && !customerName.trim()) || isSelling}
              variant="primary"
            >
              Vender
            </Button>
          </div>
       </div>
     </div>
   );
 };

export default SellModal;
