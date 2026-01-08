import { CatalogRepository } from './repository';
import { Brand, Model, DynamicAttribute } from './types';
import { Result } from '../shared/result';
import { DatabaseError, ValidationError } from '../shared/errors';

export class CatalogService {
  constructor(private repository: CatalogRepository) {}

  async getBrandsBySubcategory(subcategoryId: string): Promise<Result<Brand[], DatabaseError | ValidationError>> {
    if (!subcategoryId || subcategoryId.trim() === '') {
      return Result.fail(new ValidationError('Subcategory ID is required'));
    }

    return this.repository.getBrandsBySubcategory(subcategoryId);
  }

  async getAllBrands(): Promise<Result<Brand[], DatabaseError>> {
    return this.repository.getAllBrands();
  }

  async getModelsByBrand(brandId: string): Promise<Result<Model[], DatabaseError | ValidationError>> {
    if (!brandId || brandId.trim() === '') {
      return Result.fail(new ValidationError('Brand ID is required'));
    }

    return this.repository.getModelsByBrand(brandId);
  }

  async getDynamicAttributesBySubcategory(subcategoryId: string): Promise<Result<DynamicAttribute[], DatabaseError | ValidationError>> {
    if (!subcategoryId || subcategoryId.trim() === '') {
      return Result.fail(new ValidationError('Subcategory ID is required'));
    }

    return this.repository.getDynamicAttributesBySubcategory(subcategoryId);
  }

  async getFormConfigForSubcategory(subcategoryId: string): Promise<Result<{
    attributes: Record<string, DynamicAttribute[]>;
    brands: Brand[];
    total_fields: number;
    required_fields: number;
  }, DatabaseError | ValidationError>> {
    const attributesResult = await this.getDynamicAttributesBySubcategory(subcategoryId);
    const brandsResult = await this.getBrandsBySubcategory(subcategoryId);

    if (attributesResult.isFailure) {
      return Result.fail(attributesResult.error);
    }

    if (brandsResult.isFailure) {
      return Result.fail(brandsResult.error);
    }

    // Group attributes by field_group
    const groupedAttributes = attributesResult.value.reduce((acc, attr) => {
      const group = attr.field_group || 'General';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(attr);
      return acc;
    }, {} as Record<string, DynamicAttribute[]>);

    return Result.ok({
      attributes: groupedAttributes,
      brands: brandsResult.value,
      total_fields: attributesResult.value.length,
      required_fields: attributesResult.value.filter(a => a.is_required).length,
    });
  }
}
