/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProductReviewCommentCreateDto } from '../models/ProductReviewCommentCreateDto';
import type { ProductReviewCommentDto } from '../models/ProductReviewCommentDto';
import type { ProductReviewCommentReactionDto } from '../models/ProductReviewCommentReactionDto';
import type { ProductReviewCreateDto } from '../models/ProductReviewCreateDto';
import type { ProductReviewDto } from '../models/ProductReviewDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProductReviewService {
    /**
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postApiProductReviewCreate(
        requestBody?: ProductReviewCreateDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/ProductReview/create',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param reviewId
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postApiProductReviewComment(
        reviewId: string,
        requestBody?: ProductReviewCommentCreateDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/ProductReview/{reviewId}/comment',
            path: {
                'reviewId': reviewId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param reviewId
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static putApiProductReviewComment(
        reviewId: string,
        requestBody?: ProductReviewCommentDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/ProductReview/{reviewId}/comment',
            path: {
                'reviewId': reviewId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param reviewId
     * @param commentId
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postApiProductReviewCommentReaction(
        reviewId: string,
        commentId: string,
        requestBody?: ProductReviewCommentReactionDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/ProductReview/{reviewId}/comment/{commentId}/reaction',
            path: {
                'reviewId': reviewId,
                'commentId': commentId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param reviewId
     * @returns any OK
     * @throws ApiError
     */
    public static getApiProductReview(
        reviewId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/ProductReview/{reviewId}',
            path: {
                'reviewId': reviewId,
            },
        });
    }
    /**
     * @param reviewId
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static putApiProductReview(
        reviewId: string,
        requestBody?: ProductReviewDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/ProductReview/{reviewId}',
            path: {
                'reviewId': reviewId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param reviewId
     * @returns any OK
     * @throws ApiError
     */
    public static deleteApiProductReview(
        reviewId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/ProductReview/{reviewId}',
            path: {
                'reviewId': reviewId,
            },
        });
    }
    /**
     * @param productId
     * @returns any OK
     * @throws ApiError
     */
    public static getApiProductReviewProduct(
        productId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/ProductReview/product/{productId}',
            path: {
                'productId': productId,
            },
        });
    }
    /**
     * @param sellerId
     * @returns any OK
     * @throws ApiError
     */
    public static getApiProductReviewSeller(
        sellerId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/ProductReview/seller/{sellerId}',
            path: {
                'sellerId': sellerId,
            },
        });
    }
    /**
     * @param reviewId
     * @returns any OK
     * @throws ApiError
     */
    public static getApiProductReviewComments(
        reviewId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/ProductReview/{reviewId}/comments',
            path: {
                'reviewId': reviewId,
            },
        });
    }
    /**
     * @param reviewId
     * @param commentId
     * @returns any OK
     * @throws ApiError
     */
    public static deleteApiProductReviewComment(
        reviewId: string,
        commentId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/ProductReview/{reviewId}/comment/{commentId}',
            path: {
                'reviewId': reviewId,
                'commentId': commentId,
            },
        });
    }
}
