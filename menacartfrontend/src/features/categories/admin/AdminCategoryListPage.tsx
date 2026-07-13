import React, { useState } from 'react';
import { useCategoriesTree, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../products/hooks/useCategories';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { useToast } from '../../../components/Toast';
import { ImageUpload } from '../../../components/ImageUpload/ImageUpload';
import type { Category } from '../../../types/category';
import './AdminCategoryListPage.css';

export const AdminCategoryListPage: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();
  const { data: categoriesTree, isLoading, error, refetch } = useCategoriesTree();

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryImageUrl, setCategoryImageUrl] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState<number | undefined>(undefined);

  // Flattened categories for the dropdown select (excluding current category in edit mode)
  const getFlatCategories = (nodes: Category[] | undefined, excludeId?: number): { id: number; name: string }[] => {
    if (!nodes) return [];
    let list: { id: number; name: string }[] = [];
    const traverse = (node: Category) => {
      if (excludeId && node.categoryId === excludeId) return;
      list.push({ id: node.categoryId, name: node.name });
      node.childCategories?.forEach(traverse);
    };
    nodes.forEach(traverse);
    return list;
  };

  const flatCategories = getFlatCategories(categoriesTree, editingCategory?.categoryId);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryImageUrl('');
    setParentCategoryId(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryImageUrl(category.imageUrl || '');
    setParentCategoryId(category.parentCategoryId || undefined);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({
          id: editingCategory.categoryId,
          data: {
            name: categoryName.trim(),
            imageUrl: categoryImageUrl.trim() || null,
            parentCategoryId: parentCategoryId || undefined,
          },
        });
        toastSuccess('Category updated successfully');
      } else {
        await createMutation.mutateAsync({
          name: categoryName.trim(),
          imageUrl: categoryImageUrl.trim() || null,
          parentCategoryId: parentCategoryId || undefined,
        });
        toastSuccess('Category created successfully');
      }
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Category action failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this category? (It must not be in use by any products or child categories)')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toastSuccess('Category deleted successfully');
      refetch();
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Failed to delete category. Ensure it is empty and not linked to products.');
    }
  };

  // Recursive Tree Renderer
  const renderCategoryNode = (node: Category, depth = 0) => {
    return (
      <div key={node.categoryId} className="tree-node-wrapper" style={{ marginLeft: `${depth * 24}px` }}>
        <div className="tree-node">
          <div className="tree-node-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="tree-node-bullet">↳</span>
            {node.imageUrl && (
              <img src={node.imageUrl} alt={node.name} style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} />
            )}
            <span className="tree-node-name">{node.name}</span>
            {node.parentCategoryName && (
              <span className="tree-node-parent-badge">sub of {node.parentCategoryName}</span>
            )}
          </div>
          <div className="tree-node-actions">
            <Button variant="secondary" size="sm" onClick={() => handleOpenEdit(node)}>
              Edit
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="btn-delete"
              onClick={() => handleDelete(node.categoryId)}
              isLoading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </div>
        </div>
        {node.childCategories && node.childCategories.map((child) => renderCategoryNode(child, depth + 1))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="admin-categories-container loading">
        <div className="loading-spinner"></div>
        <p>Loading category tree...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-categories-container error">
        <p className="error-message">Error loading category tree: {(error as any).message}</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="admin-categories-container">
      <div className="admin-categories-header">
        <div>
          <h1 className="admin-categories-title">Platform Category Tree</h1>
          <p className="admin-categories-subtitle">Organize and manage the clothing category structure</p>
        </div>
        <Button onClick={handleOpenCreate}>+ Add Category</Button>
      </div>

      <div className="category-tree-card">
        {categoriesTree && categoriesTree.length === 0 ? (
          <div className="categories-empty">
            <h2>No categories defined</h2>
            <p>Create a category structure to begin organizing marketplace listings.</p>
            <Button onClick={handleOpenCreate}>Create First Category</Button>
          </div>
        ) : (
          <div className="category-tree-list">
            {categoriesTree?.map((cat) => renderCategoryNode(cat, 0))}
          </div>
        )}
      </div>

      {/* Modal Form Overlay */}
      {isModalOpen && (
        <div className="category-modal-overlay">
          <div className="category-modal">
            <h3>{editingCategory ? 'Edit Category' : 'Create Category'}</h3>
            <p className="modal-desc">
              {editingCategory ? 'Modify platform category credentials.' : 'Add a new category branch to organize items.'}
            </p>
            <form onSubmit={handleModalSubmit}>
              <Input
                label="Category Name"
                type="text"
                required
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />

              <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                <ImageUpload
                  label="Category Image (Optional)"
                  value={categoryImageUrl}
                  onChange={setCategoryImageUrl}
                />
              </div>

              <div className="input-group" style={{ marginTop: '16px', marginBottom: '24px' }}>
                <label className="input-label">Parent Category (Optional)</label>
                <select
                  className="input-field select-field"
                  value={parentCategoryId || ''}
                  onChange={(e) => setParentCategoryId(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                >
                  <option value="">None (Top Level)</option>
                  {flatCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="category-modal-actions">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
