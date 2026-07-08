export interface Category {
  categoryId: number;
  name: string;
  parentCategoryId: number | null;
  parentCategoryName: string | null;
  childCategories: Category[];
}

export interface CreateCategoryRequest {
  name: string;
  parentCategoryId?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  parentCategoryId?: number;
}
