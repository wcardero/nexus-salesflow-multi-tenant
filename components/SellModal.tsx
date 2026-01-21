// components/SellModal.tsx
import React from 'react';
import { Product, InventoryGroup, SalePaymentStatus } from '../types';

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSell: (quantity: number, paymentStatus: SalePaymentStatus, customerName?: string) => void;
  product: Product | null;
  inventoryGroup: InventoryGroup | null;
}

const SellModal: React.FC<SellModalProps> = ({ isOpen, onClose, onSell, product, inventoryGroup }) => {
  const [quantity, setQuantity] = React.useState(1);
  const [paymentStatus, setPaymentStatus] = React.useState<SalePaymentStatus>(SalePaymentStatus.PAID);
  const [customerName, setCustomerName] = React.useState('');

  if (!isOpen || !product || !inventoryGroup) return null;

  const handleSell = () => {
    onSell(quantity, paymentStatus, paymentStatus === SalePaymentStatus.PENDING ? customerName : undefined);
  };

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
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentStatus"
                  value={SalePaymentStatus.PAID}
                  checked={paymentStatus === SalePaymentStatus.PAID}
                  onChange={(e) => setPaymentStatus(e.target.value as SalePaymentStatus)}
                  className="mr-2"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Pago al contado</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentStatus"
                  value={SalePaymentStatus.PENDING}
                  checked={paymentStatus === SalePaymentStatus.PENDING}
                  onChange={(e) => setPaymentStatus(e.target.value as SalePaymentStatus)}
                  className="mr-2"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Venta al crédito</span>
              </label>
            </div>
          </div>

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
            <button
              type="button"
              onClick={handleSell}
              disabled={quantity <= 0 || quantity > inventoryGroup.quantity || (paymentStatus === SalePaymentStatus.PENDING && !customerName.trim())}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-700 hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700 rounded-md shadow-md transition-all disabled:bg-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Vender
            </button>
          </div>
       </div>
     </div>
   );
 };

export default SellModal;
