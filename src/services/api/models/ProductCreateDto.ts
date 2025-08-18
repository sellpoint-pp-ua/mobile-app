/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProductFeatureDto } from './ProductFeatureDto';
export type ProductCreateDto = {
    name?: string | null;
    productType?: string | null;
    category?: string | null;
    features?: Array<ProductFeatureDto> | null;
    price?: number;
    discountPrice?: number | null;
    sellerId?: string | null;
    quantityStatus?: string | null;
    quantity?: number;
};

