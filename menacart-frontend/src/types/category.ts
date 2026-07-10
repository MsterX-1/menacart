export interface Category {
  categoryId: number;
  name: string;
  parentCategoryId: number | null;
  imageUrl?: string | null;
  parentCategoryName: string | null;
  childCategories: Category[];
}

export interface CreateCategoryRequest {
  name: string;
  imageUrl?: string | null;
  parentCategoryId?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  imageUrl?: string | null;
  parentCategoryId?: number;
}
