// components/SellModal.tsx
import React from 'react';
import { Product, InventoryGroup } from '../types';

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSell: (quantity: number) => void;
  product: Product | null;
  inventoryGroup: InventoryGroup | null;
}

const SellModal: React.FC<SellModalProps> = ({ isOpen, onClose, onSell, product, inventoryGroup }) => {
  const [quantity, setQuantity] = React.useState(1);

  if (!isOpen || !product || !inventoryGroup) return null;

  const handleSell = () => {
    onSell(quantity);
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
          <div className="flex justify-end gap-2 flex-wrap">
            <button
              onClick={onClose}
              className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md"
            >
              Cancelar
            </button>
            <button
              onClick={handleSell}
              disabled={quantity <= 0 || quantity > inventoryGroup.quantity}
              className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-success-600 hover:text-success-800 font-bold rounded-md disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              Vender
            </button>
          </div>
       </div>
     </div>
  );
 };

export default SellModal;
