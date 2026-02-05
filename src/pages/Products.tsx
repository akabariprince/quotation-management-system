import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, Image as ImageIcon } from 'lucide-react';
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
            <Button className="btn-accent">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
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
            className="pl-10"
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full enterprise-card p-12 text-center text-muted-foreground">
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
                <span className={`absolute top-2 right-2 ${product.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                  {product.status}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground font-mono">{product.partCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <span>{getCategoryName(product.categoryId)}</span>
                  <span>•</span>
                  <span>{getProductTypeName(product.productTypeId)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(product.basePrice)}</p>
                    <p className="text-xs text-muted-foreground">Default Discount: {product.defaultDiscount}%</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="p-2 hover:bg-muted rounded-md transition-colors"
                    >
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </button>
                    {hasPermission('edit_masters') && (
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 hover:bg-destructive/10 rounded-md transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedProduct(null)} />
          <div className="relative bg-card rounded-lg shadow-xl w-full max-w-2xl p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-2xl"
            >
              ×
            </button>
            <div className="flex gap-6">
              <div className="w-1/3">
                {selectedProduct.images[0] ? (
                  <img 
                    src={selectedProduct.images[0]} 
                    alt={selectedProduct.name}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-1">{selectedProduct.name}</h2>
                <p className="text-muted-foreground font-mono mb-4">{selectedProduct.partCode}</p>
                <p className="text-sm text-muted-foreground mb-4">{selectedProduct.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Base Price</p>
                    <p className="font-semibold">{formatCurrency(selectedProduct.basePrice)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Default Discount</p>
                    <p className="font-semibold">{selectedProduct.defaultDiscount}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">GST</p>
                    <p className="font-semibold">{selectedProduct.gstPercent}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <span className={selectedProduct.status === 'active' ? 'badge-success' : 'badge-warning'}>
                      {selectedProduct.status}
                    </span>
                  </div>
                </div>
                {(selectedProduct.length || selectedProduct.width || selectedProduct.height) && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">Dimensions</p>
                    <div className="flex gap-4 text-sm">
                      {selectedProduct.length > 0 && <span>L: {selectedProduct.length}mm</span>}
                      {selectedProduct.width > 0 && <span>W: {selectedProduct.width}mm</span>}
                      {selectedProduct.height > 0 && <span>H: {selectedProduct.height}mm</span>}
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
