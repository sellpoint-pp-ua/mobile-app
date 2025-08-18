/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProductMediaDto } from '../models/ProductMediaDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProductMediaService {
    /**
     * @returns ProductMediaDto OK
     * @throws ApiError
     */
    public static getApiProductMedia(): CancelablePromise<Array<ProductMediaDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/ProductMedia',
        });
    }
    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteApiProductMediaById(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/ProductMedia/by-id/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param productId
     * @returns any OK
     * @throws ApiError
     */
    public static deleteApiProductMediaByProductId(
        productId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/ProductMedia/by-product-id/{productId}',
            path: {
                'productId': productId,
            },
        });
    }
    /**
     * @param productId
     * @returns ProductMediaDto OK
     * @throws ApiError
     */
    public static getApiProductMediaByProductId(
        productId: string,
    ): CancelablePromise<Array<ProductMediaDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/ProductMedia/by-product-id/{productId}',
            path: {
                'productId': productId,
            },
        });
    }
    /**
     * @param productId
     * @param formData
     * @returns ProductMediaDto OK
     * @throws ApiError
     */
    public static postApiProductMediaMany(
        productId?: string,
        formData?: {
            files?: Array<Blob>;
        },
    ): CancelablePromise<Array<ProductMediaDto>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/ProductMedia/many',
            query: {
                'productId': productId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
}
