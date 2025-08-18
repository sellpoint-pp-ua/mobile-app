/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProductFeatureDto } from './ProductFeatureDto';
export type ProductDto = {
    id?: string | null;
    name?: string | null;
    productType?: string | null;
    categoryPath?: Array<string> | null;
    features?: Array<ProductFeatureDto> | null;
    price?: number;
    discountPrice?: number | null;
    readonly hasDiscount?: boolean;
    readonly finalPrice?: number;
    readonly discountPercentage?: number | null;
    sellerId?: string | null;
    quantityStatus?: string | null;
    quantity?: number;
};

