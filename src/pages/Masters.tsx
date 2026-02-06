import React, { useState } from 'react';
import { Plus, Trash2, Check, Clock, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import OTPModal from '@/components/common/OTPModal';
import { toast } from 'sonner';

const Masters: React.FC = () => {
  const { hasPermission } = useAuth();
  const { 
    categories, addCategory, updateCategory, deleteCategory,
    productTypes, addProductType, updateProductType, deleteProductType,
    productModels, addProductModel, updateProductModel, deleteProductModel,
    woods, addWood, updateWood, deleteWood,
    polishes, addPolish, updatePolish, deletePolish,
    fabrics, addFabric, updateFabric, deleteFabric,
  } = useData();

  const [activeTab, setActiveTab] = useState('category');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [selectedParent, setSelectedParent] = useState('');
  const [pendingItem, setPendingItem] = useState<any>(null);
  const [showOTPModal, setShowOTPModal] = useState(false);

  const handleAdd = () => {
    if (!newItemName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    let newItem: any;
    
    switch (activeTab) {
      case 'category':
        newItem = addCategory({ name: newItemName, status: 'pending' });
        break;
      case 'productType':
        if (!selectedParent) {
          toast.error('Please select a category');
          return;
        }
        newItem = addProductType({ name: newItemName, categoryId: selectedParent, status: 'pending' });
        break;
      case 'productModel':
        if (!selectedParent) {
          toast.error('Please select a product type');
          return;
        }
        newItem = addProductModel({ name: newItemName, productTypeId: selectedParent, status: 'pending' });
        break;
      case 'wood':
        newItem = addWood({ name: newItemName, status: 'pending' });
        break;
      case 'polish':
        newItem = addPolish({ name: newItemName, status: 'pending' });
        break;
      case 'fabric':
        newItem = addFabric({ name: newItemName, status: 'pending' });
        break;
    }

    setPendingItem({ ...newItem, type: activeTab });
    setShowAddModal(false);
    setNewItemName('');
    setSelectedParent('');
    setShowOTPModal(true);
  };

  const handleOTPVerify = () => {
    if (pendingItem) {
      switch (pendingItem.type) {
        case 'category':
          updateCategory(pendingItem.id, { status: 'active' });
          break;
        case 'productType':
          updateProductType(pendingItem.id, { status: 'active' });
          break;
        case 'productModel':
          updateProductModel(pendingItem.id, { status: 'active' });
          break;
        case 'wood':
          updateWood(pendingItem.id, { status: 'active' });
          break;
        case 'polish':
          updatePolish(pendingItem.id, { status: 'active' });
          break;
        case 'fabric':
          updateFabric(pendingItem.id, { status: 'active' });
          break;
      }
      toast.success(`${pendingItem.name} activated successfully`);
    }
    setShowOTPModal(false);
    setPendingItem(null);
  };

  const handleDelete = (id: string, type: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    switch (type) {
      case 'category':
        deleteCategory(id);
        break;
      case 'productType':
        deleteProductType(id);
        break;
      case 'productModel':
        deleteProductModel(id);
        break;
      case 'wood':
        deleteWood(id);
        break;
      case 'polish':
        deletePolish(id);
        break;
      case 'fabric':
        deleteFabric(id);
        break;
    }
    toast.success('Item deleted successfully');
  };

  const renderTable = (items: any[], type: string, parentKey?: string) => (
    <div className="enterprise-card overflow-hidden">
      <div className="table-container">
        <table className="enterprise-table">
          <thead>
            <tr>
              <th>Name</th>
              {parentKey && <th className="hidden sm:table-cell">Parent</th>}
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={parentKey ? 4 : 3} className="text-center text-muted-foreground py-12">
                  No items found. Add your first item.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td className="font-medium">{item.name}</td>
                  {parentKey && (
                    <td className="hidden sm:table-cell text-muted-foreground">
                      {type === 'productType' 
                        ? categories.find(c => c.id === item.categoryId)?.name 
                        : productTypes.find(p => p.id === item.productTypeId)?.name}
                    </td>
                  )}
                  <td>
                    <span className={item.status === 'active' ? 'badge-success' : 'badge-warning'}>
                      {item.status === 'active' ? (
                        <><Check className="h-3 w-3" /> Active</>
                      ) : (
                        <><Clock className="h-3 w-3" /> Pending</>
                      )}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {item.status === 'pending' && (
                        <button
                          onClick={() => {
                            setPendingItem({ ...item, type });
                            setShowOTPModal(true);
                          }}
                          className="text-xs text-accent hover:underline font-medium"
                        >
                          Activate
                        </button>
                      )}
                      {hasPermission('edit_masters') && (
                        <button
                          onClick={() => handleDelete(item.id, type)}
                          className="action-btn action-btn-danger"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const getTabLabel = (tab: string) => {
    const labels: Record<string, string> = {
      category: 'Category',
      productType: 'Product Type',
      productModel: 'Product Model',
      wood: 'Wood',
      polish: 'Polish',
      fabric: 'Fabric',
    };
    return labels[tab] || tab;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Master Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage categories, product types, materials, and more
          </p>
        </div>
        {hasPermission('edit_masters') && (
          <Button className="btn-accent gap-2" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add {getTabLabel(activeTab)}</span>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-auto">
            <TabsTrigger value="category">Category</TabsTrigger>
            <TabsTrigger value="productType">Type</TabsTrigger>
            <TabsTrigger value="productModel">Model</TabsTrigger>
            <TabsTrigger value="wood">Wood</TabsTrigger>
            <TabsTrigger value="polish">Polish</TabsTrigger>
            <TabsTrigger value="fabric">Fabric</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="category">
          {renderTable(categories, 'category')}
        </TabsContent>

        <TabsContent value="productType">
          {renderTable(productTypes, 'productType', 'categoryId')}
        </TabsContent>

        <TabsContent value="productModel">
          {renderTable(productModels, 'productModel', 'productTypeId')}
        </TabsContent>

        <TabsContent value="wood">
          {renderTable(woods, 'wood')}
        </TabsContent>

        <TabsContent value="polish">
          {renderTable(polishes, 'polish')}
        </TabsContent>

        <TabsContent value="fabric">
          {renderTable(fabrics, 'fabric')}
        </TabsContent>
      </Tabs>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Add {getTabLabel(activeTab)}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              {(activeTab === 'productType') && (
                <div className="space-y-2">
                  <Label>Select Category</Label>
                  <Select value={selectedParent} onValueChange={setSelectedParent}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c.status === 'active').map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {(activeTab === 'productModel') && (
                <div className="space-y-2">
                  <Label>Select Product Type</Label>
                  <Select value={selectedParent} onValueChange={setSelectedParent}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      {productTypes.filter(p => p.status === 'active').map(pt => (
                        <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Enter name"
                  className="h-11"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1 h-11">
                  Cancel
                </Button>
                <Button onClick={handleAdd} className="flex-1 h-11 btn-accent">
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      <OTPModal
        isOpen={showOTPModal}
        onClose={() => {
          setShowOTPModal(false);
          setPendingItem(null);
        }}
        onVerify={handleOTPVerify}
        title="Master Activation"
        description={`Verify OTP to activate "${pendingItem?.name}"`}
        type="master_activation"
      />
    </div>
  );
};

export default Masters;
