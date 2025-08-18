/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProductReviewCommentReactionDto } from './ProductReviewCommentReactionDto';
export type ProductReviewCommentDto = {
    id?: string | null;
    rating?: number;
    userId?: string | null;
    comment?: string | null;
    createdAt?: string;
    reactions?: Array<ProductReviewCommentReactionDto> | null;
    readonly positiveCount?: number;
    readonly negativeCount?: number;
};

