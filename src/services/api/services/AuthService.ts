/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * @param formData
     * @returns any OK
     * @throws ApiError
     */
    public static postApiAuthLogin(
        formData?: {
            Login?: string;
            Password?: string;
            DeviceInfo?: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/Auth/login',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * @param formData
     * @returns any OK
     * @throws ApiError
     */
    public static postApiAuthRegister(
        formData?: {
            FullName?: string;
            Email?: string;
            Password?: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/Auth/register',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * @returns any OK
     * @throws ApiError
     */
    public static postApiAuthLogout(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/Auth/logout',
        });
    }
    /**
     * @param language
     * @returns any OK
     * @throws ApiError
     */
    public static postApiAuthSendEmailVerificationCode(
        language?: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/Auth/send-email-verification-code',
            query: {
                'language': language,
            },
        });
    }
    /**
     * @param code
     * @returns any OK
     * @throws ApiError
     */
    public static getApiAuthVerifyEmailCode(
        code?: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/Auth/verify-email-code',
            query: {
                'code': code,
            },
        });
    }
}
