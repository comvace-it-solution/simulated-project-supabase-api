import { httpClient } from "@/api/httpClient";
import type { ApiSuccessResponse, LoginResponseData } from "@/types/api";

export const loginApi = async (
  email: string,
  password: string,
): Promise<LoginResponseData> => {
  const response = await httpClient.post<ApiSuccessResponse<LoginResponseData>>(
    "/auth/login",
    {
      email,
      password,
    },
  );

  return response.data.data;
};
