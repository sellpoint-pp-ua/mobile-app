/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AvailableFiltersCreateDto } from '../models/AvailableFiltersCreateDto';
import type { AvailableFiltersDto } from '../models/AvailableFiltersDto';
import type { AvailableFiltersItemDto } from '../models/AvailableFiltersItemDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AvailableFiltersService {
    /**
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postApiAvailableFilters(
        requestBody?: AvailableFiltersCreateDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/AvailableFilters',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns AvailableFiltersDto OK
     * @throws ApiError
     */
    public static getApiAvailableFilters(): CancelablePromise<Array<AvailableFiltersDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/AvailableFilters',
        });
    }
    /**
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static putApiAvailableFilters(
        requestBody?: AvailableFiltersDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/AvailableFilters',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param categoryId
     * @returns AvailableFiltersDto OK
     * @throws ApiError
     */
    public static getApiAvailableFilters1(
        categoryId: string,
    ): CancelablePromise<Array<AvailableFiltersDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/AvailableFilters/{categoryId}',
            path: {
                'categoryId': categoryId,
            },
        });
    }
    /**
     * @param categoryId
     * @returns any OK
     * @throws ApiError
     */
    public static deleteApiAvailableFiltersByCategory(
        categoryId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/AvailableFilters/by-category/{categoryId}',
            path: {
                'categoryId': categoryId,
            },
        });
    }
    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteApiAvailableFilters(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/AvailableFilters/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param categoryId
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postApiAvailableFiltersAddFilters(
        categoryId: string,
        requestBody?: Array<AvailableFiltersDto>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/AvailableFilters/{categoryId}/add-filters',
            path: {
                'categoryId': categoryId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param categoryId
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static deleteApiAvailableFiltersRemoveFilters(
        categoryId: string,
        requestBody?: Array<string>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/AvailableFilters/{categoryId}/remove-filters',
            path: {
                'categoryId': categoryId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static putApiAvailableFiltersUpdateFilters(
        id: string,
        requestBody?: Array<AvailableFiltersItemDto>,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/AvailableFilters/{id}/update-filters',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
