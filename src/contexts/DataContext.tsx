import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
export interface Category {
  id: string;
  name: string;
  status: 'pending' | 'active';
  createdAt: Date;
}

export interface ProductType {
  id: string;
  name: string;
  categoryId: string;
  status: 'pending' | 'active';
  createdAt: Date;
}

export interface ProductModel {
  id: string;
  name: string;
  productTypeId: string;
  status: 'pending' | 'active';
  createdAt: Date;
}

export interface Wood {
  id: string;
  name: string;
  status: 'pending' | 'active';
  createdAt: Date;
}

export interface Polish {
  id: string;
  name: string;
  status: 'pending' | 'active';
  createdAt: Date;
}

export interface Fabric {
  id: string;
  name: string;
  status: 'pending' | 'active';
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  partCode: string;
  categoryId: string;
  productTypeId: string;
  productModelId: string;
  woodId: string;
  polishId: string;
  fabricId: string;
  length: number;
  width: number;
  height: number;
  description: string;
  basePrice: number;
  defaultDiscount: number;
  gstPercent: number;
  images: string[];
  status: 'pending' | 'active';
  createdAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  address: string;
  gstin: string;
  contactPerson: string;
  city: string;
  state: string;
  region: string;
  createdAt: Date;
}

export interface QuotationItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  description: string;
  images: string[];
  basePrice: number;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
  quantity: number;
  total: number;
  gstPercent: number;
  igst: number;
  cgst: number;
  sgst: number;
  totalWithGst: number;
  notes: string[];
}

export interface Quotation {
  id: string;
  quotationNo: string;
  date: Date;
  customerId: string;
  salesManager: string;
  items: QuotationItem[];
  subtotal: number;
  totalDiscount: number;
  igst: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  grandTotalWithGst: number;
  status: 'draft' | 'sent' | 'approved' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

export interface OTPLog {
  id: string;
  type: 'discount' | 'master_activation';
  entityId: string;
  entityType: string;
  requestedBy: string;
  approvedBy?: string;
  otp: string;
  status: 'pending' | 'approved' | 'expired';
  createdAt: Date;
  approvedAt?: Date;
}

interface DataContextType {
  // Categories
  categories: Category[];
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Product Types
  productTypes: ProductType[];
  addProductType: (productType: Omit<ProductType, 'id' | 'createdAt'>) => ProductType;
  updateProductType: (id: string, updates: Partial<ProductType>) => void;
  deleteProductType: (id: string) => void;

  // Product Models
  productModels: ProductModel[];
  addProductModel: (productModel: Omit<ProductModel, 'id' | 'createdAt'>) => ProductModel;
  updateProductModel: (id: string, updates: Partial<ProductModel>) => void;
  deleteProductModel: (id: string) => void;

  // Woods
  woods: Wood[];
  addWood: (wood: Omit<Wood, 'id' | 'createdAt'>) => Wood;
  updateWood: (id: string, updates: Partial<Wood>) => void;
  deleteWood: (id: string) => void;

  // Polishes
  polishes: Polish[];
  addPolish: (polish: Omit<Polish, 'id' | 'createdAt'>) => Polish;
  updatePolish: (id: string, updates: Partial<Polish>) => void;
  deletePolish: (id: string) => void;

  // Fabrics
  fabrics: Fabric[];
  addFabric: (fabric: Omit<Fabric, 'id' | 'createdAt'>) => Fabric;
  updateFabric: (id: string, updates: Partial<Fabric>) => void;
  deleteFabric: (id: string) => void;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Customers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Quotations
  quotations: Quotation[];
  addQuotation: (quotation: Omit<Quotation, 'id' | 'quotationNo' | 'createdAt' | 'updatedAt'>) => Quotation;
  updateQuotation: (id: string, updates: Partial<Quotation>) => void;
  deleteQuotation: (id: string) => void;
  getNextQuotationNumber: () => string;

  // OTP Logs
  otpLogs: OTPLog[];
  addOTPLog: (log: Omit<OTPLog, 'id' | 'createdAt'>) => OTPLog;
  updateOTPLog: (id: string, updates: Partial<OTPLog>) => void;

  // Sales Managers
  salesManagers: string[];
}

// Initial mock data
const initialCategories: Category[] = [
  { id: '1', name: 'Living Room', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '2', name: 'Dining', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '3', name: 'Bedroom', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '4', name: 'Office', status: 'active', createdAt: new Date('2025-01-01') },
];

const initialProductTypes: ProductType[] = [
  { id: '1', name: 'Sofa', categoryId: '1', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '2', name: 'Center Table', categoryId: '1', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '3', name: 'Side Table', categoryId: '1', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '4', name: 'Dining Table', categoryId: '2', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '5', name: 'Dining Chair', categoryId: '2', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '6', name: 'Bed', categoryId: '3', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '7', name: 'Side Cabinet', categoryId: '3', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '8', name: 'Accent Chair', categoryId: '1', status: 'active', createdAt: new Date('2025-01-01') },
];

const initialProductModels: ProductModel[] = [
  { id: '1', name: 'Sectional', productTypeId: '1', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '2', name: 'L-Shaped', productTypeId: '1', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '3', name: 'Round', productTypeId: '2', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '4', name: 'Nested Pair', productTypeId: '3', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '5', name: '6 Seater', productTypeId: '4', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '6', name: 'Standard', productTypeId: '5', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '7', name: 'King Size', productTypeId: '6', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '8', name: 'Modern', productTypeId: '7', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '9', name: 'Lounge', productTypeId: '8', status: 'active', createdAt: new Date('2025-01-01') },
];

const initialWoods: Wood[] = [
  { id: '1', name: 'Teakwood', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '2', name: 'Oak', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '3', name: 'Walnut', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '4', name: 'Plywood with Veneer', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '5', name: 'M.S Frame', status: 'active', createdAt: new Date('2025-01-01') },
];

const initialPolishes: Polish[] = [
  { id: '1', name: 'P.U Polish (Water Based)', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '2', name: 'P.U Paint (Satin Black)', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '3', name: 'Natural Finish', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '4', name: 'Matte Finish', status: 'active', createdAt: new Date('2025-01-01') },
];

const initialFabrics: Fabric[] = [
  { id: '1', name: 'Artificial Leather', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '2', name: 'Premium Fabric', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '3', name: 'Velvet', status: 'active', createdAt: new Date('2025-01-01') },
  { id: '4', name: 'Linen', status: 'active', createdAt: new Date('2025-01-01') },
];

const initialCustomers: Customer[] = [
  {
    id: '1',
    name: 'Mayank Shah',
    mobile: '+91 94238 71364',
    email: 'mayank.shah@gmail.com',
    address: 'Flat 302, Green Valley Apartments, Koregaon Park',
    gstin: '27AAFCS1234M1ZM',
    contactPerson: 'Mayank Shah',
    city: 'Pune',
    state: 'Maharashtra',
    region: 'West',
    createdAt: new Date('2025-01-15'),
  },
  {
    id: '2',
    name: 'Priya Patel',
    mobile: '+91 98765 43210',
    email: 'priya.patel@gmail.com',
    address: 'B-201, Sunrise Towers, Bandra West',
    gstin: '27AAFCP5678N1ZN',
    contactPerson: 'Priya Patel',
    city: 'Mumbai',
    state: 'Maharashtra',
    region: 'West',
    createdAt: new Date('2025-01-20'),
  },
  {
    id: '3',
    name: 'Rahul Sharma',
    mobile: '+91 87654 32109',
    email: 'rahul.sharma@gmail.com',
    address: 'House No. 45, Sector 15',
    gstin: '06AAFCR9012P1ZP',
    contactPerson: 'Rahul Sharma',
    city: 'Gurgaon',
    state: 'Haryana',
    region: 'North',
    createdAt: new Date('2025-02-01'),
  },
];

const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Sectional Sofa - Living Room',
    partCode: 'S00_Vx(Sx)',
    categoryId: '1',
    productTypeId: '1',
    productModelId: '1',
    woodId: '1',
    polishId: '1',
    fabricId: '1',
    length: 0,
    width: 0,
    height: 0,
    description: 'Base frame & support: Teakwood with P.U polish [water based]. Upholstery: Artificial leather / Fabric',
    basePrice: 265000,
    defaultDiscount: 15,
    gstPercent: 18,
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'],
    status: 'active',
    createdAt: new Date('2025-01-01'),
  },
  {
    id: '2',
    name: 'Center Table - Living Room',
    partCode: 'LT00_Vx(Sx)',
    categoryId: '1',
    productTypeId: '2',
    productModelId: '3',
    woodId: '5',
    polishId: '2',
    fabricId: '1',
    length: 0,
    width: 0,
    height: 0,
    description: 'Base frame & support: M.S with P.U paint finish [Satin Black]. Table Top: Teakwood with P.U polish [water based]',
    basePrice: 54600,
    defaultDiscount: 15,
    gstPercent: 18,
    images: ['https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800'],
    status: 'active',
    createdAt: new Date('2025-01-01'),
  },
  {
    id: '3',
    name: 'Side Table - Living Room',
    partCode: 'LT22_V1(Sx)',
    categoryId: '1',
    productTypeId: '3',
    productModelId: '4',
    woodId: '1',
    polishId: '1',
    fabricId: '1',
    length: 600,
    width: 750,
    height: 400,
    description: 'Base frame & support: Teakwood with P.U polish [water based]. Table Top: Teakwood with P.U polish [water based]',
    basePrice: 48600,
    defaultDiscount: 15,
    gstPercent: 18,
    images: ['https://images.unsplash.com/photo-1499933374294-4584851497cc?w=800'],
    status: 'active',
    createdAt: new Date('2025-01-01'),
  },
  {
    id: '4',
    name: 'Dining Table - Dining',
    partCode: 'HT00_Vx(Sx)',
    categoryId: '2',
    productTypeId: '4',
    productModelId: '5',
    woodId: '5',
    polishId: '1',
    fabricId: '1',
    length: 0,
    width: 0,
    height: 0,
    description: 'Base frame & support: M.S with P.U paint [water based]. Table Top: Plywood with veneer finished with P.U polish [water based]',
    basePrice: 180000,
    defaultDiscount: 15,
    gstPercent: 18,
    images: ['https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800'],
    status: 'active',
    createdAt: new Date('2025-01-01'),
  },
  {
    id: '5',
    name: 'Dining Chair - Standard',
    partCode: 'GC12_V1(Sx)',
    categoryId: '2',
    productTypeId: '5',
    productModelId: '6',
    woodId: '1',
    polishId: '1',
    fabricId: '1',
    length: 0,
    width: 0,
    height: 0,
    description: 'Base frame & support: Teakwood with P.U polish [water based]. Upholstery: Artificial leather / Fabric',
    basePrice: 22500,
    defaultDiscount: 15,
    gstPercent: 18,
    images: ['https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800'],
    status: 'active',
    createdAt: new Date('2025-01-01'),
  },
  {
    id: '6',
    name: 'Dining Chair - Premium',
    partCode: 'GC12_V2(Sx)',
    categoryId: '2',
    productTypeId: '5',
    productModelId: '6',
    woodId: '1',
    polishId: '1',
    fabricId: '2',
    length: 0,
    width: 0,
    height: 0,
    description: 'Base frame & support: Teakwood with P.U polish [water based]. Upholstery: Premium Fabric',
    basePrice: 25000,
    defaultDiscount: 15,
    gstPercent: 20,
    images: ['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800'],
    status: 'active',
    createdAt: new Date('2025-01-01'),
  },
  {
    id: '7',
    name: 'King Size Bed - Bedroom',
    partCode: 'GB11_V1(Sx)',
    categoryId: '3',
    productTypeId: '6',
    productModelId: '7',
    woodId: '1',
    polishId: '1',
    fabricId: '1',
    length: 0,
    width: 0,
    height: 0,
    description: 'Base frame & support: Teakwood with P.U polish [water based]. Upholstery: Artificial leather / Fabric. Mattress not included in the quotation',
    basePrice: 225000,
    defaultDiscount: 15,
    gstPercent: 18,
    images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800'],
    status: 'active',
    createdAt: new Date('2025-01-01'),
  },
  {
    id: '8',
    name: 'Side Cabinet - Bedroom',
    partCode: 'LSC11_V1(Sx)',
    categoryId: '3',
    productTypeId: '7',
    productModelId: '8',
    woodId: '1',
    polishId: '1',
    fabricId: '1',
    length: 0,
    width: 0,
    height: 0,
    description: 'Base frame & support: Teakwood with P.U polish [water based]',
    basePrice: 36000,
    defaultDiscount: 15,
    gstPercent: 18,
    images: ['https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=800'],
    status: 'active',
    createdAt: new Date('2025-01-01'),
  },
  {
    id: '9',
    name: 'Accent Chair - Living Room',
    partCode: 'AC01_V1(Sx)',
    categoryId: '1',
    productTypeId: '8',
    productModelId: '9',
    woodId: '1',
    polishId: '1',
    fabricId: '2',
    length: 0,
    width: 0,
    height: 0,
    description: 'Base frame & support: Teakwood with P.U polish [water based]. Upholstery: Premium Fabric',
    basePrice: 42000,
    defaultDiscount: 15,
    gstPercent: 18,
    images: ['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800'],
    status: 'active',
    createdAt: new Date('2025-01-01'),
  },
];

const initialQuotations: Quotation[] = [
  {
    id: '1',
    quotationNo: 'QT-0001',
    date: new Date('2025-02-07'),
    customerId: '1',
    salesManager: 'ESIPL',
    items: [
      {
        id: '1',
        productId: '1',
        productCode: 'S00_Vx(Sx)',
        productName: 'Sectional Sofa - Living Room',
        description: 'Base frame & support: Teakwood with P.U polish [water based]. Upholstery: Artificial leather / Fabric',
        images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'],
        basePrice: 265000,
        discountPercent: 15,
        discountAmount: 39750,
        finalPrice: 225250,
        quantity: 1,
        total: 225250,
        gstPercent: 18,
        igst: 0,
        cgst: 20273,
        sgst: 20273,
        totalWithGst: 265795,
        notes: ['Sectional Sofa - Living Room', 'Base frame & support: Teakwood with P.U polish [water based]', 'Upholstery: Artificial leather / Fabric'],
      },
    ],
    subtotal: 225250,
    totalDiscount: 39750,
    igst: 0,
    cgst: 20273,
    sgst: 20273,
    grandTotal: 225250,
    grandTotalWithGst: 265795,
    status: 'sent',
    createdAt: new Date('2025-02-07'),
    updatedAt: new Date('2025-02-07'),
  },
];

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [productTypes, setProductTypes] = useState<ProductType[]>(initialProductTypes);
  const [productModels, setProductModels] = useState<ProductModel[]>(initialProductModels);
  const [woods, setWoods] = useState<Wood[]>(initialWoods);
  const [polishes, setPolishes] = useState<Polish[]>(initialPolishes);
  const [fabrics, setFabrics] = useState<Fabric[]>(initialFabrics);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
  const [otpLogs, setOtpLogs] = useState<OTPLog[]>([]);

  const salesManagers = ['ESIPL', 'Raj Kumar', 'Anita Desai', 'Vikram Singh'];

  // Generate unique ID
  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  // Category operations
  const addCategory = (category: Omit<Category, 'id' | 'createdAt'>): Category => {
    const newCategory = { ...category, id: generateId(), createdAt: new Date() };
    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // Product Type operations
  const addProductType = (productType: Omit<ProductType, 'id' | 'createdAt'>): ProductType => {
    const newProductType = { ...productType, id: generateId(), createdAt: new Date() };
    setProductTypes(prev => [...prev, newProductType]);
    return newProductType;
  };

  const updateProductType = (id: string, updates: Partial<ProductType>) => {
    setProductTypes(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProductType = (id: string) => {
    setProductTypes(prev => prev.filter(p => p.id !== id));
  };

  // Product Model operations
  const addProductModel = (productModel: Omit<ProductModel, 'id' | 'createdAt'>): ProductModel => {
    const newProductModel = { ...productModel, id: generateId(), createdAt: new Date() };
    setProductModels(prev => [...prev, newProductModel]);
    return newProductModel;
  };

  const updateProductModel = (id: string, updates: Partial<ProductModel>) => {
    setProductModels(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProductModel = (id: string) => {
    setProductModels(prev => prev.filter(p => p.id !== id));
  };

  // Wood operations
  const addWood = (wood: Omit<Wood, 'id' | 'createdAt'>): Wood => {
    const newWood = { ...wood, id: generateId(), createdAt: new Date() };
    setWoods(prev => [...prev, newWood]);
    return newWood;
  };

  const updateWood = (id: string, updates: Partial<Wood>) => {
    setWoods(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const deleteWood = (id: string) => {
    setWoods(prev => prev.filter(w => w.id !== id));
  };

  // Polish operations
  const addPolish = (polish: Omit<Polish, 'id' | 'createdAt'>): Polish => {
    const newPolish = { ...polish, id: generateId(), createdAt: new Date() };
    setPolishes(prev => [...prev, newPolish]);
    return newPolish;
  };

  const updatePolish = (id: string, updates: Partial<Polish>) => {
    setPolishes(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePolish = (id: string) => {
    setPolishes(prev => prev.filter(p => p.id !== id));
  };

  // Fabric operations
  const addFabric = (fabric: Omit<Fabric, 'id' | 'createdAt'>): Fabric => {
    const newFabric = { ...fabric, id: generateId(), createdAt: new Date() };
    setFabrics(prev => [...prev, newFabric]);
    return newFabric;
  };

  const updateFabric = (id: string, updates: Partial<Fabric>) => {
    setFabrics(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteFabric = (id: string) => {
    setFabrics(prev => prev.filter(f => f.id !== id));
  };

  // Product operations
  const addProduct = (product: Omit<Product, 'id' | 'createdAt'>): Product => {
    const newProduct = { ...product, id: generateId(), createdAt: new Date() };
    setProducts(prev => [...prev, newProduct]);
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Customer operations
  const addCustomer = (customer: Omit<Customer, 'id' | 'createdAt'>): Customer => {
    const newCustomer = { ...customer, id: generateId(), createdAt: new Date() };
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  // Quotation operations
  const getNextQuotationNumber = (): string => {
    const maxNum = quotations.reduce((max, q) => {
      const num = parseInt(q.quotationNo.replace('QT-', ''));
      return num > max ? num : max;
    }, 0);
    return `QT-${String(maxNum + 1).padStart(4, '0')}`;
  };

  const addQuotation = (quotation: Omit<Quotation, 'id' | 'quotationNo' | 'createdAt' | 'updatedAt'>): Quotation => {
    const newQuotation = {
      ...quotation,
      id: generateId(),
      quotationNo: getNextQuotationNumber(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setQuotations(prev => [...prev, newQuotation]);
    return newQuotation;
  };

  const updateQuotation = (id: string, updates: Partial<Quotation>) => {
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, ...updates, updatedAt: new Date() } : q));
  };

  const deleteQuotation = (id: string) => {
    setQuotations(prev => prev.filter(q => q.id !== id));
  };

  // OTP operations
  const addOTPLog = (log: Omit<OTPLog, 'id' | 'createdAt'>): OTPLog => {
    const newLog = { ...log, id: generateId(), createdAt: new Date() };
    setOtpLogs(prev => [...prev, newLog]);
    return newLog;
  };

  const updateOTPLog = (id: string, updates: Partial<OTPLog>) => {
    setOtpLogs(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  return (
    <DataContext.Provider value={{
      categories, addCategory, updateCategory, deleteCategory,
      productTypes, addProductType, updateProductType, deleteProductType,
      productModels, addProductModel, updateProductModel, deleteProductModel,
      woods, addWood, updateWood, deleteWood,
      polishes, addPolish, updatePolish, deletePolish,
      fabrics, addFabric, updateFabric, deleteFabric,
      products, addProduct, updateProduct, deleteProduct,
      customers, addCustomer, updateCustomer, deleteCustomer,
      quotations, addQuotation, updateQuotation, deleteQuotation, getNextQuotationNumber,
      otpLogs, addOTPLog, updateOTPLog,
      salesManagers,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
