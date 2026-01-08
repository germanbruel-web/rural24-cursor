import { CategoryRepository } from './repository';
import { Category } from './types';
import { Result } from '../shared/result';
import { DatabaseError, NotFoundError } from '../shared/errors';

export class CategoryService {
  constructor(private repository: CategoryRepository) {}

  async getAllCategories(): Promise<Result<Category[], DatabaseError>> {
    return this.repository.getAllCategories();
  }

  async getCategoryById(id: string): Promise<Result<Category, DatabaseError | NotFoundError>> {
    const result = await this.repository.getCategoryById(id);

    if (result.isFailure) {
      return Result.fail(result.error);
    }

    if (!result.value) {
      return Result.fail(new NotFoundError(`Category with id ${id} not found`));
    }

    return Result.ok(result.value);
  }

  async getCategoryBySlug(slug: string): Promise<Result<Category | null, DatabaseError>> {
    const allCategoriesResult = await this.repository.getAllCategories();

    if (allCategoriesResult.isFailure) {
      return Result.fail(allCategoriesResult.error);
    }

    const category = allCategoriesResult.value.find(cat => cat.slug === slug);

    return Result.ok(category || null);
  }
}
