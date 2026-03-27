import { httpClient } from "@/api/httpClient";
import type {
  ApiSuccessResponse,
  AttendanceRecordsResponseData,
} from "@/types/api";

type AttendanceActionResponse = {
  attendanceId: number;
};

export const startAttendanceApi = async (
  userId: number,
): Promise<AttendanceActionResponse> => {
  const response = await httpClient.post<ApiSuccessResponse<AttendanceActionResponse>>(
    "/attendance/start",
    { userId },
  );

  return response.data.data;
};

export const startBreakApi = async (
  userId: number,
): Promise<AttendanceActionResponse> => {
  const response = await httpClient.post<ApiSuccessResponse<AttendanceActionResponse>>(
    "/attendance/break/start",
    { userId },
  );

  return response.data.data;
};

export const endBreakApi = async (
  userId: number,
): Promise<AttendanceActionResponse> => {
  const response = await httpClient.post<ApiSuccessResponse<AttendanceActionResponse>>(
    "/attendance/break/end",
    { userId },
  );

  return response.data.data;
};

export const endAttendanceApi = async (
  userId: number,
): Promise<AttendanceActionResponse> => {
  const response = await httpClient.post<ApiSuccessResponse<AttendanceActionResponse>>(
    "/attendance/end",
    { userId },
  );

  return response.data.data;
};

export const fetchAttendanceRecordsApi = async (
  userId: number,
  targetMonth: string,
): Promise<AttendanceRecordsResponseData> => {
  const response = await httpClient.get<
    ApiSuccessResponse<AttendanceRecordsResponseData>
  >("/attendance/records", {
    params: {
      userId,
      targetMonth,
    },
  });

  return response.data.data;
};
