import { httpClient } from "@/api/httpClient";
import type {
  ApiSuccessResponse,
  UserListItem,
  UserProfile,
} from "@/types/api";

type UsersListResponseData = {
  users: UserListItem[];
};

export const fetchUsersApi = async (): Promise<UserListItem[]> => {
  const response = await httpClient.get<ApiSuccessResponse<UsersListResponseData>>(
    "/users",
  );

  return response.data.data.users;
};

export const fetchUserProfileApi = async (userId: number): Promise<UserProfile> => {
  const response = await httpClient.get<ApiSuccessResponse<UserProfile>>(
    `/users/${userId}`,
  );

  return response.data.data;
};
