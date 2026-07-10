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
import { MultiImageUpload, type ImageItem } from '../../../components/ImageUpload/MultiImageUpload';
import './SellerProductFormPage.css';


// Schema validation
const variantSchema = z.object({
  variantId: z.number().optional(),
  sku: z.string().min(1, 'SKU is required').max(50),
  color: z.string().max(50).optional().or(z.literal('')),
  size: z.string().max(20).optional().or(z.literal('')),
  stockQuantity: z.number().min(0, 'Stock cannot be negative'),
  price: z.number().min(0.01, 'Price must be at least 0.01'),
  mainImageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  variantImages: z.array(z.string()).optional(),
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
    watch,
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
      variants: [{ sku: '', color: '', size: '', stockQuantity: 10, price: 29.99, mainImageUrl: '', variantImages: [] }],
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
          variantImages: v.variantImages || [],
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
        variantImages: v.variantImages || [],
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

  const watchedMainImage = watch('mainImageUrl');
  const watchedProductImages = watch('productImages');
  const watchedVariants = watch('variants');

  const getCombinedImages = (): ImageItem[] => {
    const mainImageUrl = watchedMainImage;
    const productImages = watchedProductImages || [];
    
    const items: ImageItem[] = [];
    if (mainImageUrl) {
      items.push({ url: mainImageUrl, isMain: true });
    }
    productImages.forEach((url: string) => {
      items.push({ url, isMain: false });
    });
    return items;
  };

  const getCombinedVariantImages = (index: number): ImageItem[] => {
    const mainImageUrl = watchedVariants?.[index]?.mainImageUrl;
    const variantImages = watchedVariants?.[index]?.variantImages || [];
    
    const items: ImageItem[] = [];
    if (mainImageUrl) {
      items.push({ url: mainImageUrl, isMain: true });
    }
    variantImages.forEach((url: string) => {
      items.push({ url, isMain: false });
    });
    return items;
  };

  const handleCombinedVariantImagesChange = (index: number, newImages: ImageItem[]) => {
    const mainImg = newImages.find(img => img.isMain)?.url || '';
    const otherImgs = newImages.filter(img => !img.isMain).map(img => img.url);
    
    setValue(`variants.${index}.mainImageUrl`, mainImg, { shouldDirty: true });
    setValue(`variants.${index}.variantImages`, otherImgs, { shouldDirty: true });
  };

  const handleCombinedImagesChange = (newImages: ImageItem[]) => {
    const mainImg = newImages.find(img => img.isMain)?.url || '';
    const otherImgs = newImages.filter(img => !img.isMain).map(img => img.url);
    
    setValue('mainImageUrl', mainImg, { shouldDirty: true });
    setValue('productImages', otherImgs, { shouldDirty: true });
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
                    <optgroup key={cat.categoryId} label={cat.name}>
                      <option value={cat.categoryId}>{cat.name} (General)</option>
                      {cat.childCategories?.map((child) => (
                        <option key={child.categoryId} value={child.categoryId}>
                          {child.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {errors.categoryId && <span className="input-error">{errors.categoryId.message}</span>}
              </div>
            </div>

            <div className="form-row-grid">
              <Input
                label="Base Price (EGP)"
                type="number"
                step="0.01"
                error={errors.basePrice?.message}
                {...register('basePrice', { valueAsNumber: true })}
              />

              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <MultiImageUpload
                  label="Product Images"
                  images={getCombinedImages()}
                  onChange={handleCombinedImagesChange}
                />
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
                  append({ sku: '', color: '', size: '', stockQuantity: 5, price: 29.99, mainImageUrl: '', variantImages: [] })
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
                      label="Price (EGP)"
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

                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <MultiImageUpload
                      label="Variant Images"
                      images={getCombinedVariantImages(index)}
                      onChange={(newImages) => handleCombinedVariantImagesChange(index, newImages)}
                    />
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
