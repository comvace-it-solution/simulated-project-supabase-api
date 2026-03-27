import { httpClient } from "@/api/httpClient";
import type {
  ApiSuccessResponse,
  UserListItem,
  UserProfile,
} from "@/types/api";

export type CreateUserRequest = {
  userName: string;
  password: string;
  email: string;
  phoneNumber: string;
  postalCode: string;
  prefecture: string;
  streetAddress: string;
  buildingName: string;
  birthDate: string;
  assignmentDate: string;
};

type CreateUserResponseData = {
  userId: number;
};

export type UpdateUserRequest = {
  userName: string;
  password?: string;
  email: string;
  phoneNumber: string;
  postalCode: string;
  prefecture: string;
  streetAddress: string;
  buildingName: string;
  birthDate: string;
  assignmentDate: string;
};

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

export const createUserApi = async (
  payload: CreateUserRequest,
): Promise<CreateUserResponseData> => {
  const response = await httpClient.post<ApiSuccessResponse<CreateUserResponseData>>(
    "/users",
    payload,
  );

  return response.data.data;
};

export const updateUserApi = async (
  userId: number,
  payload: UpdateUserRequest,
): Promise<CreateUserResponseData> => {
  const response = await httpClient.patch<ApiSuccessResponse<CreateUserResponseData>>(
    `/users/${userId}`,
    payload,
  );

  return response.data.data;
};
