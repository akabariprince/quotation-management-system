import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Check, Clock, X, Image as ImageIcon, Edit2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData, Product } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import OTPModal from '@/components/common/OTPModal';
import { toast } from 'sonner';

const Masters: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { hasPermission, user } = useAuth();
  const { 
    categories, addCategory, updateCategory, deleteCategory,
    productTypes, addProductType, updateProductType, deleteProductType,
    productModels, addProductModel, updateProductModel, deleteProductModel,
    woods, addWood, updateWood, deleteWood,
    polishes, addPolish, updatePolish, deletePolish,
    fabrics, addFabric, updateFabric, deleteFabric,
    products, addProduct, updateProduct, deleteProduct,
    addOTPLog,
  } = useData();

  const tabParam = searchParams.get('tab');
  const validTabs = ['category', 'productType', 'productModel', 'wood', 'polish', 'fabric', 'product'];
  const initialTab = tabParam && validTabs.includes(tabParam) ? tabParam : 'category';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [selectedParent, setSelectedParent] = useState('');
  const [pendingItem, setPendingItem] = useState<any>(null);
  const [showOTPModal, setShowOTPModal] = useState(false);

  // Update tab when URL changes
  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Product form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    partCode: '',
    categoryId: '',
    productTypeId: '',
    productModelId: '',
    woodId: '',
    polishId: '',
    fabricId: '',
    length: 0,
    width: 0,
    height: 0,
    description: '',
    basePrice: 0,
    defaultDiscount: 15,
    gstPercent: 18,
    images: [''],
  });

  const resetProductForm = () => {
    setProductForm({
      name: '',
      partCode: '',
      categoryId: '',
      productTypeId: '',
      productModelId: '',
      woodId: '',
      polishId: '',
      fabricId: '',
      length: 0,
      width: 0,
      height: 0,
      description: '',
      basePrice: 0,
      defaultDiscount: 15,
      gstPercent: 18,
      images: [''],
    });
    setEditingProduct(null);
  };

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

  const handleProductSubmit = () => {
    // Validation
    if (!productForm.name.trim()) {
      toast.error('Please enter product name');
      return;
    }
    if (!productForm.partCode.trim()) {
      toast.error('Please enter part code');
      return;
    }
    if (!productForm.categoryId) {
      toast.error('Please select a category');
      return;
    }
    if (!productForm.productTypeId) {
      toast.error('Please select a product type');
      return;
    }
    if (productForm.basePrice <= 0) {
      toast.error('Please enter a valid base price');
      return;
    }

    const productData = {
      name: productForm.name,
      partCode: productForm.partCode,
      categoryId: productForm.categoryId,
      productTypeId: productForm.productTypeId,
      productModelId: productForm.productModelId || '',
      woodId: productForm.woodId || '',
      polishId: productForm.polishId || '',
      fabricId: productForm.fabricId || '',
      length: productForm.length,
      width: productForm.width,
      height: productForm.height,
      description: productForm.description,
      basePrice: productForm.basePrice,
      defaultDiscount: productForm.defaultDiscount,
      gstPercent: productForm.gstPercent,
      images: productForm.images.filter(img => img.trim() !== ''),
      status: 'pending' as const,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
      toast.success('Product updated successfully');
    } else {
      const newProduct = addProduct(productData);
      setPendingItem({ ...newProduct, type: 'product' });
      setShowOTPModal(true);
    }

    setShowProductForm(false);
    resetProductForm();
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      partCode: product.partCode,
      categoryId: product.categoryId,
      productTypeId: product.productTypeId,
      productModelId: product.productModelId,
      woodId: product.woodId,
      polishId: product.polishId,
      fabricId: product.fabricId,
      length: product.length,
      width: product.width,
      height: product.height,
      description: product.description,
      basePrice: product.basePrice,
      defaultDiscount: product.defaultDiscount,
      gstPercent: product.gstPercent,
      images: product.images.length > 0 ? product.images : [''],
    });
    setShowProductForm(true);
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
        case 'product':
          updateProduct(pendingItem.id, { status: 'active' });
          break;
      }
      
      addOTPLog({
        type: 'master_activation',
        entityId: pendingItem.id,
        entityType: pendingItem.type,
        requestedBy: user?.email || '',
        otp: '123456',
        status: 'approved',
        approvedAt: new Date(),
      });
      
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
      case 'product':
        deleteProduct(id);
        break;
    }
    toast.success('Item deleted successfully');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredProductTypes = productTypes.filter(pt => pt.categoryId === productForm.categoryId && pt.status === 'active');
  const filteredProductModels = productModels.filter(pm => pm.productTypeId === productForm.productTypeId && pm.status === 'active');

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

  const renderProductsTable = () => (
    <div className="enterprise-card overflow-hidden">
      <div className="table-container">
        <table className="enterprise-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Code</th>
              <th>Name</th>
              <th className="hidden md:table-cell">Category</th>
              <th className="hidden lg:table-cell">Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted-foreground py-12">
                  No products found. Add your first product.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="w-10 h-10 rounded overflow-hidden bg-muted">
                      {product.images[0] ? (
                        <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="font-mono text-xs">{product.partCode}</td>
                  <td className="font-medium max-w-[150px] truncate">{product.name}</td>
                  <td className="hidden md:table-cell text-muted-foreground">
                    {categories.find(c => c.id === product.categoryId)?.name || '-'}
                  </td>
                  <td className="hidden lg:table-cell">{formatCurrency(product.basePrice)}</td>
                  <td>
                    <span className={product.status === 'active' ? 'badge-success' : 'badge-warning'}>
                      {product.status === 'active' ? (
                        <><Check className="h-3 w-3" /> Active</>
                      ) : (
                        <><Clock className="h-3 w-3" /> Pending</>
                      )}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {product.status === 'pending' && (
                        <button
                          onClick={() => {
                            setPendingItem({ ...product, type: 'product' });
                            setShowOTPModal(true);
                          }}
                          className="text-xs text-accent hover:underline font-medium"
                        >
                          Activate
                        </button>
                      )}
                      {hasPermission('edit_masters') && (
                        <>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="action-btn"
                          >
                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, 'product')}
                            className="action-btn action-btn-danger"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </button>
                        </>
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
      product: 'Product',
    };
    return labels[tab] || tab;
  };

  const handleAddClick = () => {
    if (activeTab === 'product') {
      resetProductForm();
      setShowProductForm(true);
    } else {
      setShowAddModal(true);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Master Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage categories, product types, materials, and products
          </p>
        </div>
        {hasPermission('edit_masters') && (
          <Button className="btn-accent gap-2" onClick={handleAddClick}>
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
            <TabsTrigger value="product">Product</TabsTrigger>
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

        <TabsContent value="product">
          {renderProductsTable()}
        </TabsContent>
      </Tabs>

      {/* Add Modal for simple masters */}
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

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="modal-backdrop" onClick={() => setShowProductForm(false)}>
          <div className="modal-content p-6 max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <button
                onClick={() => {
                  setShowProductForm(false);
                  resetProductForm();
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground border-b border-border pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Product Name *</Label>
                    <Input
                      value={productForm.name}
                      onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Sectional Sofa - Living Room"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Part Code *</Label>
                    <Input
                      value={productForm.partCode}
                      onChange={(e) => setProductForm(prev => ({ ...prev, partCode: e.target.value }))}
                      placeholder="e.g., S00_Vx(Sx)"
                      className="h-11 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Classification */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground border-b border-border pb-2">Classification</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select 
                      value={productForm.categoryId} 
                      onValueChange={(v) => setProductForm(prev => ({ 
                        ...prev, 
                        categoryId: v, 
                        productTypeId: '', 
                        productModelId: '' 
                      }))}
                    >
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
                  <div className="space-y-2">
                    <Label>Product Type *</Label>
                    <Select 
                      value={productForm.productTypeId} 
                      onValueChange={(v) => setProductForm(prev => ({ ...prev, productTypeId: v, productModelId: '' }))}
                      disabled={!productForm.categoryId}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredProductTypes.map(pt => (
                          <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Product Model</Label>
                    <Select 
                      value={productForm.productModelId} 
                      onValueChange={(v) => setProductForm(prev => ({ ...prev, productModelId: v }))}
                      disabled={!productForm.productTypeId}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredProductModels.map(pm => (
                          <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              

              {/* Dimensions */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground border-b border-border pb-2">Dimensions (mm)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Length</Label>
                    <Input
                      type="number"
                      value={productForm.length || ''}
                      onChange={(e) => setProductForm(prev => ({ ...prev, length: Number(e.target.value) }))}
                      placeholder="0"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Width</Label>
                    <Input
                      type="number"
                      value={productForm.width || ''}
                      onChange={(e) => setProductForm(prev => ({ ...prev, width: Number(e.target.value) }))}
                      placeholder="0"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Height</Label>
                    <Input
                      type="number"
                      value={productForm.height || ''}
                      onChange={(e) => setProductForm(prev => ({ ...prev, height: Number(e.target.value) }))}
                      placeholder="0"
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground border-b border-border pb-2">Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Base Price (₹) *</Label>
                    <Input
                      type="number"
                      value={productForm.basePrice || ''}
                      onChange={(e) => setProductForm(prev => ({ ...prev, basePrice: Number(e.target.value) }))}
                      placeholder="Enter price"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Discount (%)</Label>
                    <Input
                      type="number"
                      value={productForm.defaultDiscount}
                      onChange={(e) => setProductForm(prev => ({ ...prev, defaultDiscount: Number(e.target.value) }))}
                      min={0}
                      max={100}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>GST (%)</Label>
                    <Input
                      type="number"
                      value={productForm.gstPercent}
                      onChange={(e) => setProductForm(prev => ({ ...prev, gstPercent: Number(e.target.value) }))}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter product description..."
                  className="min-h-[80px]"
                />
              </div>

              {/* Images */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground border-b border-border pb-2">Images</h3>
                {productForm.images.map((img, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      value={img}
                      onChange={(e) => {
                        const newImages = [...productForm.images];
                        newImages[idx] = e.target.value;
                        setProductForm(prev => ({ ...prev, images: newImages }));
                      }}
                      placeholder="Image URL"
                      className="flex-1 h-11"
                    />
                    {productForm.images.length > 1 && (
                      <button
                        onClick={() => {
                          const newImages = productForm.images.filter((_, i) => i !== idx);
                          setProductForm(prev => ({ ...prev, images: newImages }));
                        }}
                        className="p-2 hover:bg-destructive/10 rounded-lg"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProductForm(prev => ({ ...prev, images: [...prev.images, ''] }))}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Image
                </Button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowProductForm(false);
                    resetProductForm();
                  }} 
                  className="flex-1 h-11"
                >
                  Cancel
                </Button>
                <Button onClick={handleProductSubmit} className="flex-1 h-11 btn-accent">
                  {editingProduct ? 'Update Product' : 'Add Product'}
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
