import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, Eye, Image as ImageIcon, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData, Product } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const Products: React.FC = () => {
  const { hasPermission } = useAuth();
  const { products, categories, productTypes, deleteProduct } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.partCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id);
      toast.success('Product deleted successfully');
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unknown';
  };

  const getProductTypeName = (productTypeId: string) => {
    return productTypes.find(p => p.id === productTypeId)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product catalog
          </p>
        </div>
        {hasPermission('edit_masters') && (
          <Link to="/products/new">
            <Button className="btn-accent gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Product</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="enterprise-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or part code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full enterprise-card p-12 text-center text-muted-foreground">
            <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-50" />
            {searchTerm ? 'No products found matching your search.' : 'No products yet. Add your first product.'}
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className="enterprise-card overflow-hidden group">
              <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                {product.images[0] ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <span className={`absolute top-3 right-3 ${product.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                  {product.status}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground font-mono">{product.partCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 flex-wrap">
                  <span className="bg-muted px-2 py-0.5 rounded">{getCategoryName(product.categoryId)}</span>
                  <span className="bg-muted px-2 py-0.5 rounded">{getProductTypeName(product.productTypeId)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(product.basePrice)}</p>
                    <p className="text-xs text-muted-foreground">Discount: {product.defaultDiscount}%</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="action-btn"
                    >
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </button>
                    {hasPermission('edit_masters') && (
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="action-btn action-btn-danger"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">{selectedProduct.name}</h2>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="sm:w-1/3">
                {selectedProduct.images[0] ? (
                  <img 
                    src={selectedProduct.images[0]} 
                    alt={selectedProduct.name}
                    className="w-full aspect-square object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full aspect-square bg-muted rounded-xl flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-muted-foreground font-mono text-sm mb-2">{selectedProduct.partCode}</p>
                  <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Base Price</p>
                    <p className="font-semibold text-lg">{formatCurrency(selectedProduct.basePrice)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Default Discount</p>
                    <p className="font-semibold text-lg">{selectedProduct.defaultDiscount}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">GST</p>
                    <p className="font-semibold">{selectedProduct.gstPercent}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <span className={selectedProduct.status === 'active' ? 'badge-success' : 'badge-warning'}>
                      {selectedProduct.status}
                    </span>
                  </div>
                </div>
                {(selectedProduct.length || selectedProduct.width || selectedProduct.height) && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">Dimensions</p>
                    <div className="flex gap-4 text-sm">
                      {selectedProduct.length > 0 && <span className="bg-muted px-2 py-1 rounded">L: {selectedProduct.length}mm</span>}
                      {selectedProduct.width > 0 && <span className="bg-muted px-2 py-1 rounded">W: {selectedProduct.width}mm</span>}
                      {selectedProduct.height > 0 && <span className="bg-muted px-2 py-1 rounded">H: {selectedProduct.height}mm</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
