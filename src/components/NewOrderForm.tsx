import { useState } from 'react';
import { Card, Title, TextInput, Button, Select, SelectItem } from '@tremor/react';
import { useStore } from '@/store';

const orderTypes = [
  { value: 'repair', label: 'Repair' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'installation', label: 'Installation' },
];

export default function NewOrderForm() {
  const { addOrder } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const newOrder = await response.json();
      addOrder(newOrder);

      // Reset form
      setFormData({
        type: '',
        description: '',
      });
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-6">
      <Title>Create New Order</Title>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value })}
            placeholder="Select order type"
            required
          >
            {orderTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </Select>
        </div>

        <div>
          <TextInput
            placeholder="Order description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        <Button
          type="submit"
          loading={isLoading}
          loadingText="Creating..."
          size="lg"
          className="w-full"
        >
          Create Order
        </Button>
      </form>
    </Card>
  );
} 