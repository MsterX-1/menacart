import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useProductDetail, useCreateProduct, useUpdateProduct } from '../hooks/useProducts';
import { useCategoriesTree } from '../hooks/useCategories';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { useToast } from '../../../components/Toast';
import './SellerProductFormPage.css';

const uploadImage = async (file: File): Promise<string> => {
  if (!import.meta.env.PROD) {
    // Development fallback: Use base64 data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  // Production: Cloudinary Unsigned Upload
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  if (!uploadPreset || !cloudName) {
    throw new Error('Cloudinary environment variables (VITE_CLOUDINARY_UPLOAD_PRESET or VITE_CLOUDINARY_CLOUD_NAME) are missing.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Image upload failed');
  }

  const data = await response.json();
  return data.secure_url;
};

// Schema validation
const variantSchema = z.object({
  variantId: z.number().optional(),
  sku: z.string().min(1, 'SKU is required').max(50),
  color: z.string().max(50).optional().or(z.literal('')),
  size: z.string().max(20).optional().or(z.literal('')),
  stockQuantity: z.number().min(0, 'Stock cannot be negative'),
  price: z.number().min(0.01, 'Price must be at least 0.01'),
  mainImageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional().or(z.literal('')),
  basePrice: z.number().min(0.01, 'Base price must be at least 0.01'),
  brand: z.string().max(100).optional().or(z.literal('')),
  categoryId: z.number().min(1, 'Please select a category'),
  mainImageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  productImages: z.array(z.string()).optional(),
  variants: z.array(variantSchema).min(1, 'At least one variant is required'),
});

type ProductFormValues = z.infer<typeof productSchema>;

export const SellerProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const productId = isEditMode ? parseInt(id, 10) : 0;

  const navigate = useNavigate();
  const { error: toastError, success: toastSuccess } = useToast();

  const { data: product, isLoading: isLoadingProduct } = useProductDetail(productId);
  const { data: categories } = useCategoriesTree();

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      basePrice: 29.99,
      brand: '',
      categoryId: 0,
      mainImageUrl: '',
      productImages: [],
      variants: [{ sku: '', color: '', size: '', stockQuantity: 10, price: 29.99, mainImageUrl: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  // Populate data in edit mode
  useEffect(() => {
    if (isEditMode && product) {
      reset({
        name: product.name,
        description: product.description || '',
        basePrice: product.basePrice,
        brand: product.brand || '',
        categoryId: product.categoryId,
        mainImageUrl: product.mainImageUrl || '',
        productImages: product.productImages || [],
        variants: product.variants.map((v) => ({
          variantId: v.variantId,
          sku: v.sku,
          color: v.color || '',
          size: v.size || '',
          stockQuantity: v.stockQuantity,
          price: v.price,
          mainImageUrl: v.mainImageUrl || '',
        })),
      });
    }
  }, [isEditMode, product, reset]);

  const onSubmit = async (data: ProductFormValues) => {
    try {
      // Map form values to API contracts
      const formattedVariants = data.variants.map((v) => ({
        variantId: v.variantId,
        sku: v.sku,
        color: v.color || undefined,
        size: v.size || undefined,
        stockQuantity: v.stockQuantity,
        price: v.price,
        mainImageUrl: v.mainImageUrl || undefined,
        variantImages: [],
      }));

      const payload = {
        name: data.name,
        description: data.description || undefined,
        basePrice: data.basePrice,
        brand: data.brand || undefined,
        categoryId: data.categoryId,
        mainImageUrl: data.mainImageUrl || undefined,
        productImages: data.productImages || [],
        variants: formattedVariants,
      };

      if (isEditMode) {
        await updateMutation.mutateAsync({ productId, data: payload });
        toastSuccess('Product updated and submitted for re-approval.');
      } else {
        await createMutation.mutateAsync(payload);
        toastSuccess('Product created and submitted for approval.');
      }
      navigate('/seller/products');
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Submission failed');
    }
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // toastInfo('Uploading image...'); // could add a toast here
      const url = await uploadImage(file);
      if (typeof index === 'number') {
        // Variant image
        setValue(`variants.${index}.mainImageUrl`, url, { shouldDirty: true });
      } else {
        // Main product image
        setValue('mainImageUrl', url, { shouldDirty: true });
      }
      toastSuccess('Image uploaded successfully');
    } catch (err) {
      toastError('Failed to upload image');
    }
  };

  const handleMultipleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const uploadPromises = Array.from(files).map(uploadImage);
      const urls = await Promise.all(uploadPromises);
      
      const currentImages = control._formValues.productImages || [];
      setValue('productImages', [...currentImages, ...urls], { shouldDirty: true });
      toastSuccess('Images uploaded successfully');
    } catch (err) {
      toastError('Failed to upload images');
    }
  };

  if (isEditMode && isLoadingProduct) {
    return (
      <div className="product-form-container loading">
        <div className="loading-spinner"></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="product-form-container">
      <div className="product-form-header">
        <h1 className="product-form-title">
          {isEditMode ? `Edit Product: ${product?.name}` : 'Create New Product'}
        </h1>
        <p className="product-form-subtitle">
          {isEditMode ? 'Modify details. Updates will require Admin re-approval.' : 'Add a new clothing item to the catalog.'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="product-form">
        <div className="form-sections-grid">
          {/* Left section: Product details */}
          <div className="form-section card">
            <h2 className="section-title">Product Details</h2>

            <Input
              label="Product Name"
              type="text"
              error={errors.name?.message}
              {...register('name')}
            />

            <div className="form-row-grid">
              <Input
                label="Brand"
                type="text"
                error={errors.brand?.message}
                {...register('brand')}
              />

              <div className="input-group">
                <label className="input-label">Category</label>
                <select
                  className={`input-field select-field ${errors.categoryId ? 'has-error' : ''}`}
                  {...register('categoryId', { valueAsNumber: true })}
                >
                  <option value={0}>Select a Category</option>
                  {categories?.map((cat) => (
                    <option key={cat.categoryId} value={cat.categoryId}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <span className="input-error">{errors.categoryId.message}</span>}
              </div>
            </div>

            <div className="form-row-grid">
              <Input
                label="Base Price ($)"
                type="number"
                step="0.01"
                error={errors.basePrice?.message}
                {...register('basePrice', { valueAsNumber: true })}
              />

              <div className="input-group">
                <Input
                  label="Main Image URL"
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  error={errors.mainImageUrl?.message}
                  {...register('mainImageUrl')}
                />
                <div style={{ marginTop: '0.5rem' }}>
                  <label className="input-label" style={{ fontSize: '0.85rem' }}>Or Upload File</label>
                  <input type="file" accept="image/*" onChange={(e) => handleMainImageUpload(e)} />
                </div>
              </div>

              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">Additional Product Images</label>
                <div style={{ marginTop: '0.5rem' }}>
                  <input type="file" accept="image/*" multiple onChange={handleMultipleImagesUpload} />
                </div>
                {control._formValues.productImages && control._formValues.productImages.length > 0 && (
                  <div className="product-images-preview" style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {control._formValues.productImages.map((url, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img src={url} alt={`Preview ${i}`} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = [...control._formValues.productImages!];
                            newImages.splice(i, 1);
                            setValue('productImages', newImages, { shouldDirty: true });
                          }}
                          style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea
                rows={5}
                className={`input-field textarea-field ${errors.description ? 'has-error' : ''}`}
                {...register('description')}
              />
              {errors.description && <span className="input-error">{errors.description.message}</span>}
            </div>
          </div>

          {/* Right section: Variants */}
          <div className="form-section card">
            <div className="section-title-wrapper">
              <h2 className="section-title">Product Variants</h2>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  append({ sku: '', color: '', size: '', stockQuantity: 5, price: 29.99, mainImageUrl: '' })
                }
              >
                + Add Variant
              </Button>
            </div>

            {errors.variants?.message && (
              <div className="form-validation-alert">{errors.variants.message}</div>
            )}

            <div className="variants-list">
              {fields.map((field, index) => (
                <div key={field.id} className="variant-item-card">
                  <div className="variant-item-header">
                    <h4>Variant #{index + 1}</h4>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove-variant"
                        onClick={() => remove(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="form-row-grid">
                    <Input
                      label="SKU"
                      type="text"
                      error={errors.variants?.[index]?.sku?.message}
                      {...register(`variants.${index}.sku` as const)}
                    />

                    <Input
                      label="Price ($)"
                      type="number"
                      step="0.01"
                      error={errors.variants?.[index]?.price?.message}
                      {...register(`variants.${index}.price` as const, { valueAsNumber: true })}
                    />
                  </div>

                  <div className="form-row-grid-three">
                    <Input
                      label="Color"
                      type="text"
                      placeholder="e.g. Red, Blue"
                      error={errors.variants?.[index]?.color?.message}
                      {...register(`variants.${index}.color` as const)}
                    />

                    <Input
                      label="Size"
                      type="text"
                      placeholder="e.g. M, L, XL"
                      error={errors.variants?.[index]?.size?.message}
                      {...register(`variants.${index}.size` as const)}
                    />

                    <Input
                      label="Stock"
                      type="number"
                      error={errors.variants?.[index]?.stockQuantity?.message}
                      {...register(`variants.${index}.stockQuantity` as const, { valueAsNumber: true })}
                    />
                  </div>

                  <div className="input-group">
                    <Input
                      label="Variant Image URL"
                      type="text"
                      placeholder="https://example.com/variant-image.jpg"
                      error={errors.variants?.[index]?.mainImageUrl?.message}
                      {...register(`variants.${index}.mainImageUrl` as const)}
                    />
                    <div style={{ marginTop: '0.5rem' }}>
                      <label className="input-label" style={{ fontSize: '0.85rem' }}>Or Upload File</label>
                      <input type="file" accept="image/*" onChange={(e) => handleMainImageUpload(e, index)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="form-actions-footer">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/seller/products')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={createMutation.isPending || updateMutation.isPending}
          >
            {isEditMode ? 'Save & Submit' : 'Create & Submit'}
          </Button>
        </div>
      </form>
    </div>
  );
};
