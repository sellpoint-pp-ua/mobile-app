import { OpenAPI } from "../../services/api/core/OpenAPI";
import { request } from "../../services/api/core/request";
import { useMutation } from "@tanstack/react-query";

export type RegisterDto = {
  FullName: string;
  Email: string;
  Password: string;
};

// POST /api/Auth/register (multipart)
export function registerApi(dto: RegisterDto): Promise<void> {
  const formData = new FormData();
  formData.append("FullName", dto.FullName);
  formData.append("Email", dto.Email);
  formData.append("Password", dto.Password);

  return request(OpenAPI, {
    method: "POST",
    url: "/api/Auth/register",
    formData,
    mediaType: "multipart/form-data",
  }) as any;
}

// POST /api/Auth/send-email-verification-code?language=uk
export function sendEmailCodeApi(language: string = "uk"): Promise<void> {
  return request(OpenAPI, {
    method: "POST",
    url: "/api/Auth/send-email-verification-code",
    query: { language },
  }) as any;
}

// GET /api/Auth/verify-email-code?code=XXXXXX
export function verifyEmailCodeApi(code: string): Promise<void> {
  return request(OpenAPI, {
    method: "GET",
    url: "/api/Auth/verify-email-code",
    query: { code },
  }) as any;
}

export function useRegister() {
  return useMutation({ mutationFn: registerApi });
}

export function useSendEmailCode() {
  return useMutation({ mutationFn: sendEmailCodeApi });
}

export function useVerifyEmailCode() {
  return useMutation({ mutationFn: verifyEmailCodeApi });
}
