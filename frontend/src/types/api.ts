export type ApiSuccessResponse<T> = {
  result: "success";
  message: string;
  data: T;
};

export type ApiErrorResponse = {
  result: "error";
  message: string;
};

export type LoginResponseData = {
  userId: number;
  userName: string;
};

export type UserProfile = {
  id: number;
  userName: string;
  email: string;
  phoneNumber: string | null;
  postalCode: string | null;
  prefecture: string | null;
  streetAddress: string | null;
  buildingName: string | null;
  birthDate: string | null;
  assignmentDate: string;
  currentAttendanceState: number | null;
  currentAttendanceId: number | null;
};

export type UserListItem = {
  id: number;
  userName: string;
  email: string;
  currentAttendanceState: number | null;
  currentAttendanceId: number | null;
};

export type AttendanceBreak = {
  id: number;
  breakStartDt: string;
  breakEndDt: string | null;
};

export type AttendanceRecord = {
  id: number;
  workDate: string;
  workStartDt: string;
  workEndDt: string | null;
  breaks: AttendanceBreak[];
};

export type AttendanceRecordsResponseData = {
  userId: number;
  targetMonth: string;
  attendanceRecords: AttendanceRecord[];
};
