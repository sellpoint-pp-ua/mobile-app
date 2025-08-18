/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SortDirection } from './SortDirection';
export type ProductFilterRequestDto = {
    categoryId?: string | null;
    include?: Record<string, string> | null;
    exclude?: Record<string, string> | null;
    page?: number;
    pageSize?: number;
    sort?: SortDirection;
};

