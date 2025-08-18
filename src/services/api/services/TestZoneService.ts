/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TestZoneService {
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static getApiTestZoneCheckLogin(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/test-zone/check-login',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static getApiTestZoneCheckAdmin(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/test-zone/check-admin',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static getApiTestZoneCheckUser(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/test-zone/check-user',
        });
    }
}
