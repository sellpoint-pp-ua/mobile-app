/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProductCreateDto } from '../models/ProductCreateDto';
import type { ProductDto } from '../models/ProductDto';
import type { ProductFilterRequestDto } from '../models/ProductFilterRequestDto';
import type { ProductSearchResult } from '../models/ProductSearchResult';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class ProductService {
    /**
     * @param requestBody
     * @returns ProductDto OK
     * @throws ApiError
     */
    public static postApiProductGetAll(
        requestBody?: ProductFilterRequestDto,
    ): CancelablePromise<Array<ProductDto>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/Product/get-all',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param id
     * @returns ProductDto OK
     * @throws ApiError
     */
    public static getApiProductGetById(
        id: string,
    ): CancelablePromise<ProductDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Product/get-by-id/{id}',
            path: { 'id': id },
        });
    }

    /**
     * @param name
     * @param requestBody
     * @returns ProductDto OK
     * @throws ApiError
     */
    public static postApiProductGetByName(
        name: string,
        requestBody?: ProductFilterRequestDto,
    ): CancelablePromise<Array<ProductDto>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/Product/get-by-name/{name}',
            path: { 'name': name },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param sellerId
     * @param requestBody
     * @returns ProductDto OK
     * @throws ApiError
     */
    public static postApiProductGetBySellerId(
        sellerId: string,
        requestBody?: ProductFilterRequestDto,
    ): CancelablePromise<Array<ProductDto>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/Product/get-by-seller-id/{sellerId}',
            path: { 'sellerId': sellerId },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody
     * @returns ProductDto OK
     * @throws ApiError
     */
    public static postApiProduct(
        requestBody?: ProductCreateDto,
    ): CancelablePromise<ProductDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/Product',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody
     * @returns ProductDto OK
     * @throws ApiError
     */
    public static putApiProduct(
        requestBody?: ProductDto,
    ): CancelablePromise<ProductDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/Product',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteApiProduct(
        id?: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/Product',
            query: { 'id': id },
        });
    }

    /**
     * @param name
     * @returns ProductSearchResult OK
     * @throws ApiError
     */
    public static getApiProductSearch(
        name?: string,
    ): CancelablePromise<Array<ProductSearchResult>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Product/search',
            query: { 'name': name },
        });
    }
}
