# Spec: Edit and Delete Products for Manager

## Overview
Managers need the ability to edit and delete products to maintain accurate product information and remove obsolete items. However, products that are assigned to gestors should not be editable or deletable to maintain data integrity. Stock initial (ProductStock) does not count as assigned - only AssignedInventory to gestors matters.

## Requirements

### 1. Edit Product Functionality
**Location**: `views/ManagerDashboard.tsx` - ProductsView

**Requirements:**
- Add "Editar" button for each product in the list
- Clicking "Editar" opens a modal with current product data
- Modal allows editing all fields:
  - Name
  - Cost (USD)
  - Margin (%)
  - Commission (%) - Optional, can be left empty to use store default
- Save button updates the product in the database
- Cancel button closes the modal without saving

**Validation:**
- Product can only be edited if NOT assigned to any gestor
- If assigned to gestor → Show error: "El producto no puede ser editado ni eliminado porque se encuentra asignado a un gestor."
- Do not open edit modal if product is assigned

### 2. Delete Product Functionality
**Location**: `views/ManagerDashboard.tsx` - ProductsView

**Requirements:**
- Add "Eliminar" button for each product in the list
- Clicking "Eliminar" shows confirmation dialog
- After confirmation, remove product from database
- Show success message after deletion

**Validation:**
- Product can only be deleted if NOT assigned to any gestor
- If assigned to gestor → Show error: "El producto no puede ser editado ni eliminado porque se encuentra asignado a un gestor."
- Do not show confirmation dialog if product is assigned

### 3. Assignment Status Display
**Location**: `views/ManagerDashboard.tsx` - ProductsView

**Requirements:**
- Display "Asignado a gestor" badge next to product name if assigned
- Badge should be visible and distinctive (amber color)
- Disable edit and delete buttons for assigned products (visually disabled, cursor not-allowed)

**Logic:**
- Check `db.assignedInventory` for matching `productId`
- If found in `assignedInventory` → Product is assigned
- `db.productStock` does NOT count as assigned (only assigned to gestors matters)

### 4. Helper Functions

**isProductAssignedToGestor(productId)**:
```typescript
const isProductAssignedToGestor = (productId: string): boolean => {
  return db.assignedInventory.some(ai => ai.productId === productId);
};
```

## Implementation Details

### State Variables (ProductsView)

```typescript
const [editingProduct, setEditingProduct] = useState<Product | null>(null);
const [editingName, setEditingName] = useState('');
const [editingCost, setEditingCost] = useState('');
const [editingMargin, setEditingMargin] = useState('');
const [editingCommission, setEditingCommission] = useState('');
```

### Edit Modal Structure

```tsx
{editingProduct && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6">
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Editar Producto</h3>
      <form onSubmit={handleUpdate} className="space-y-4">
        {/* Fields: Name, Cost, Margin, Commission */}
        {/* Buttons: Cancelar, Guardar Cambios */}
      </form>
    </div>
  </div>
)}
```

### Product List Item Structure

```tsx
<li key={p.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md flex flex-col gap-1">
  <div className="flex justify-between items-start">
    <div>
      <span className="font-medium text-slate-900 dark:text-slate-200">{p.name}</span>
      {assigned && (
        <span className="ml-2 text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-md">
          Asignado a gestor
        </span>
      )}
    </div>
    {/* Product info and prices */}
    {/* Action buttons: Editar, Eliminar */}
  </div>
</li>
```

### Handler Functions

**handleEdit(product)**:
```typescript
const handleEdit = (product: Product) => {
  if (isProductAssignedToGestor(product.id)) {
    alert('El producto no puede ser editado ni eliminado porque se encuentra asignado a un gestor.');
    return;
  }
  setEditingProduct(product);
  setEditingName(product.name);
  setEditingCost(product.costUSD.toString());
  setEditingMargin((product.margin * 100).toString());
  setEditingCommission(product.commissionRate !== undefined ? (product.commissionRate * 100).toString() : '');
};
```

**handleUpdate(e)**:
```typescript
const handleUpdate = (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingProduct || !editingName.trim() || !editingCost || !editingMargin) return;

  setDb(prev => {
    if (!prev) return prev;
    return {
      ...prev,
      products: prev.products.map(p =>
        p.id === editingProduct!.id
          ? {
              ...p,
              name: editingName.trim(),
              costUSD: parseFloat(editingCost),
              margin: parseFloat(editingMargin) / 100,
              commissionRate: editingCommission.trim() ? parseFloat(editingCommission) / 100 : undefined,
            }
          : p
      ),
    };
  });
  setEditingProduct(null);
  setEditingName('');
  setEditingCost('');
  setEditingMargin('');
  setEditingCommission('');
  alert('Producto actualizado exitosamente.');
};
```

**handleDelete(productId)**:
```typescript
const handleDelete = (productId: string) => {
  if (isProductAssignedToGestor(productId)) {
    alert('El producto no puede ser editado ni eliminado porque se encuentra asignado a un gestor.');
    return;
  }

  if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
    return;
  }

  setDb(prev => {
    if (!prev) return prev;
    return {
      ...prev,
      products: prev.products.filter(p => p.id !== productId),
    };
  });
  alert('Producto eliminado exitosamente.');
};
```

**isAssigned(productId)**:
```typescript
const isAssigned = (productId: string): boolean => {
  return db.assignedInventory.some(ai => ai.productId === productId);
};
```

## User Flows

### Flow 1: Edit Unassigned Product
1. Manager navigates to "Productos" tab
2. Manager sees product list with edit/delete buttons
3. Manager clicks "Editar" on an unassigned product
4. Modal opens with product's current data
5. Manager modifies one or more fields
6. Manager clicks "Guardar Cambios"
7. Product is updated in database
8. Modal closes, success message shown
9. Product list shows updated information

### Flow 2: Attempt to Edit Assigned Product
1. Manager navigates to "Productos" tab
2. Manager sees product with "Asignado a gestor" badge
3. Edit/delete buttons are disabled
4. Manager tries to click "Editar"
5. Alert appears: "El producto no puede ser editado ni eliminado porque se encuentra asignado a un gestor."
6. Modal does NOT open

### Flow 3: Delete Unassigned Product
1. Manager navigates to "Productos" tab
2. Manager clicks "Eliminar" on an unassigned product
3. Confirmation dialog appears: "¿Estás seguro de que deseas eliminar este producto?"
4. Manager confirms
5. Product is removed from database
6. Success message shown
7. Product no longer appears in list

### Flow 4: Attempt to Delete Assigned Product
1. Manager navigates to "Productos" tab
2. Manager sees product with "Asignado a gestor" badge
3. Edit/delete buttons are disabled
4. Manager tries to click "Eliminar"
5. Alert appears: "El producto no puede ser editado ni eliminado porque se encuentra asignado a un gestor."
6. Confirmation dialog does NOT appear

### Flow 5: Product in Stock Initial (Not Assigned)
1. Product has stock in `db.productStock`
2. Product is NOT in `db.assignedInventory`
3. Manager can see product is NOT assigned (no badge)
4. Manager can edit the product (button enabled)
5. Manager can delete the product (button enabled)

## Acceptance Criteria
- [ ] Edit button appears for each product
- [ ] Delete button appears for each product
- [ ] Edit modal opens with correct product data
- [ ] All fields can be edited in modal
- [ ] Changes are saved correctly
- [ ] "Asignado a gestor" badge shows for assigned products
- [ ] Badge does NOT show for products in stock initial only
- [ ] Edit button is disabled for assigned products
- [ ] Delete button is disabled for assigned products
- [ ] Error message appears when trying to edit assigned product
- [ ] Error message: "El producto no puede ser editado ni eliminado porque se encuentra asignado a un gestor."
- [ ] Error message appears when trying to delete assigned product
- [ ] Delete confirmation dialog appears for unassigned products
- [ ] Delete removes product from database
- [ ] Cancel button closes edit modal without saving
- [ ] Modal overlay has proper styling (dark background, centered)

## Edge Cases
- Product with no assigned inventory (can edit/delete)
- Product assigned to multiple gestors (cannot edit/delete)
- Product in stock initial AND assigned to gestors (cannot edit/delete)
- Product in stock initial only (can edit/delete)
- Editing product with same values (should still save)
- Trying to edit assigned product while modal is open for another product
- Delete product with associated sales (sales may need to be handled separately - future consideration)

## Backward Compatibility
- Existing products without edit/delete capability gain the feature
- No data migration needed
- All existing functionality remains unchanged
