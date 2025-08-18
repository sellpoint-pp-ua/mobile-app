/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Category } from '../models/Category';
import type { CategoryCreateDto } from '../models/CategoryCreateDto';
import type { CategoryDto } from '../models/CategoryDto';
import type { CategoryNode } from '../models/CategoryNode';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CategoryService {
    /**
     * @returns CategoryDto OK
     * @throws ApiError
     */
    public static getApiCategory(): CancelablePromise<Array<CategoryDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Category',
        });
    }
    /**
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static postApiCategory(
        requestBody?: CategoryCreateDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/Category',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns any OK
     * @throws ApiError
     */
    public static putApiCategory(
        requestBody?: CategoryDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/Category',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns Category OK
     * @throws ApiError
     */
    public static getApiCategory1(
        id: string,
    ): CancelablePromise<Category> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Category/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @returns any OK
     * @throws ApiError
     */
    public static deleteApiCategory(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/Category/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param parentId
     * @returns Category OK
     * @throws ApiError
     */
    public static getApiCategoryChildren(
        parentId: string,
    ): CancelablePromise<Array<Category>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Category/children/{parentId}',
            path: {
                'parentId': parentId,
            },
        });
    }
    /**
     * @param name
     * @param languageCode
     * @returns Category OK
     * @throws ApiError
     */
    public static getApiCategorySearch(
        name?: string,
        languageCode: string = 'en',
    ): CancelablePromise<Array<Category>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Category/search',
            query: {
                'name': name,
                'languageCode': languageCode,
            },
        });
    }
    /**
     * @returns CategoryNode OK
     * @throws ApiError
     */
    public static getApiCategoryFullTree(): CancelablePromise<CategoryNode> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Category/full-tree',
        });
    }
    /**
     * @param parentId
     * @returns CategoryNode OK
     * @throws ApiError
     */
    public static getApiCategoryCategoryTree(
        parentId: string,
    ): CancelablePromise<CategoryNode> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Category/category-tree/{parentId}',
            path: {
                'parentId': parentId,
            },
        });
    }
    /**
     * @param parentId
     * @returns CategoryNode OK
     * @throws ApiError
     */
    public static getApiCategoryChildrenNodes(
        parentId: string,
    ): CancelablePromise<Array<CategoryNode>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Category/children-nodes/{parentId}',
            path: {
                'parentId': parentId,
            },
        });
    }
}
