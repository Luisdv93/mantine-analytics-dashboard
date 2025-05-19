'use client';

import { useEffect, useState } from 'react';

import {
  Button,
  Drawer,
  DrawerProps,
  Group,
  LoadingOverlay,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';

import { useAuth } from '@/hooks/useAuth';
import { IProduct, IProductCategory } from '@/types/products';

type EditProductDrawerProps = Omit<DrawerProps, 'title' | 'children'> & {
  product: IProduct | null;
  onProductUpdated?: () => void;
};

export const EditProductDrawer = ({
  product,
  onProductUpdated,
  ...drawerProps
}: EditProductDrawerProps) => {
  const { user, accessToken, permissions } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<
    {
      value: string;
      label: string;
    }[]
  >([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  // Check if the user has permission to add products
  const canEditProduct = permissions?.includes('Permissions.Products.Edit');

  const form = useForm({
    mode: 'controlled',
    initialValues: {
      title: '',
      description: '',
      price: 0,
      quantityInStock: 0,
      sku: '',
      isActive: true,
      status: 1,
      categoryId: '',
    },
    validate: {
      title: isNotEmpty('Product title cannot be empty'),
      description: isNotEmpty('Product description cannot be empty'),
      price: isNotEmpty('Price cannot be empty'),
      quantityInStock: isNotEmpty('Quantity in stock cannot be empty'),
      categoryId: isNotEmpty('Category cannot be empty'),
    },
  });

  // Fetch categories when drawer opens
  useEffect(() => {
    if (drawerProps.opened) {
      fetchCategories();
    }
  }, [drawerProps.opened]);

  // Load product data when product changes
  useEffect(() => {
    if (product) {
      form.setValues({
        title: product.title || '',
        description: product.description || '',
        price: product.price || 0,
        quantityInStock: product.quantityInStock || 0,
        sku: product.sku || '',
        isActive: product.isActive || false,
        status: product.status || 1,
        categoryId: product.categoryId || '',
      });

      // Check if the current user is the creator of the product
      setIsCreator(user?.id === product.createdById);
    }
  }, [product, user]);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await fetch('/api/product-categories', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + accessToken,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.succeeded && result.data) {
        const categoryOptions = result.data.map(
          (category: IProductCategory) => ({
            value: category.id,
            label: category.title,
          }),
        );
        setCategories(categoryOptions);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    if (!product || !isCreator || !canEditProduct) return;

    setLoading(true);
    try {
      const payload = {
        ...values,
        modifiedById: user?.id,
      };

      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update product');
      }

      // Show success notification
      notifications.show({
        title: 'Success',
        message: 'Product updated successfully',
        color: 'green',
      });

      // Close drawer
      if (drawerProps.onClose) {
        drawerProps.onClose();
      }

      // Trigger refresh of products list
      if (onProductUpdated) {
        onProductUpdated();
      }
    } catch (error) {
      // Show error notification
      notifications.show({
        title: 'Error',
        message:
          error instanceof Error ? error.message : 'Failed to update product',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product || !isCreator) return;

    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + accessToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete product');
      }

      // Show success notification
      notifications.show({
        title: 'Success',
        message: 'Product deleted successfully',
        color: 'green',
      });

      // Close drawer
      if (drawerProps.onClose) {
        drawerProps.onClose();
      }

      // Trigger refresh of products list
      if (onProductUpdated) {
        onProductUpdated();
      }
    } catch (error) {
      // Show error notification
      notifications.show({
        title: 'Error',
        message:
          error instanceof Error ? error.message : 'Failed to delete product',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer {...drawerProps} title="Edit product">
      <LoadingOverlay visible={loading} />
      {!isCreator && (
        <Text color="red" mb="md">
          You can only edit products that you created.
        </Text>
      )}
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Title"
            placeholder="title"
            key={form.key('title')}
            {...form.getInputProps('title')}
            required
            disabled={!isCreator}
          />
          <Textarea
            label="Description"
            placeholder="description"
            key={form.key('description')}
            {...form.getInputProps('description')}
            required
            disabled={!isCreator}
          />
          <NumberInput
            label="Price"
            placeholder="price"
            {...form.getInputProps('price')}
            required
            disabled={!isCreator}
          />
          <NumberInput
            label="Quantity in stock"
            placeholder="quantity in stock"
            {...form.getInputProps('quantityInStock')}
            required
            disabled={!isCreator}
          />
          <TextInput
            label="SKU"
            placeholder="Stock Keeping Unit"
            {...form.getInputProps('sku')}
            disabled={!isCreator}
          />
          <Select
            label="Category"
            placeholder="Select category"
            data={categories}
            disabled={categoriesLoading || !isCreator}
            {...form.getInputProps('categoryId')}
            required
          />
          <Switch
            label="Active"
            {...form.getInputProps('isActive', { type: 'checkbox' })}
            disabled={!isCreator}
          />

          <Group justify="space-between" mt="xl">
            <Button color="red" onClick={handleDelete} disabled={!isCreator}>
              Delete Product
            </Button>
            <Button type="submit" disabled={!isCreator}>
              Update Product
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
};

export default EditProductDrawer;
