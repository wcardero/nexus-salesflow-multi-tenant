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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Vender Producto</h3>
        <p>Producto: {product.name}</p>
        <p>Disponibles: {inventoryGroup.quantity}</p>
        <div className="my-4">
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md"
          >
            Cancelar
          </button>
          <button
            onClick={handleSell}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
          >
            Vender
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellModal;
