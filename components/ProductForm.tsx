import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useData } from '../context/DataContext';
import Input from './ui/Input';
import Button from './ui/Button';
import Select from './ui/Select';

interface ProductFormProps {
  product: Product | null;
  onSave: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSave }) => {
  const { addProduct, updateProduct } = useData();
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: '',
    price: 0,
    commission: 0,
    imageUrl: '',
    status: 'active',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({ name: '', price: 0, commission: 0, imageUrl: 'https://res.cloudinary.com/dkwzjccok/image/upload/v1755756381/1062056d-ed24-4004-8be0-b4ed47c35360_tbezse.webp', status: 'active' });
    }
    setError(null);
    setIsLoading(false);
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'price' || name === 'commission' ? parseFloat(value) || 0 : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (product) {
        await updateProduct({ ...product, ...formData });
      } else {
        await addProduct(formData);
      }
      onSave();
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground/80 mb-1">Product Name</label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required autoFocus/>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-foreground/80 mb-1">Price</label>
          <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="commission" className="block text-sm font-medium text-foreground/80 mb-1">Commission</label>
          <Input id="commission" name="commission" type="number" step="0.01" value={formData.commission} onChange={handleChange} required />
        </div>
      </div>
      <div>
        <label htmlFor="imageUrl" className="block text-sm font-medium text-foreground/80 mb-1">Image URL</label>
        <Input id="imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleChange} required />
      </div>
       <div>
        <label htmlFor="status" className="block text-sm font-medium text-foreground/80 mb-1">Status</label>
        <Select id="status" name="status" value={formData.status} onChange={handleChange}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end pt-4 space-x-2">
        <Button type="button" variant="secondary" onClick={onSave} disabled={isLoading}>Cancel</Button>
        <Button type="submit" loading={isLoading}>Save Product</Button>
      </div>
    </form>
  );
};

export default ProductForm;
