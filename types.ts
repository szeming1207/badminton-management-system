
export interface Session {
  id: string;
  date: string; // ISO format string
  time: string;
  location: string;
  courtCount: number;
  courtFee: number;
  shuttleQty: number;
  shuttlePrice: number;
  participants: string[];
  deletionRequests?: string[]; // 新增：记录申请退出的名单
  maxParticipants: number;
}

export interface LocationConfig {
  id: string;
  name: string;
  defaultCourtFee: number;
}

export interface AnalyticsData {
  date: string;
  totalCost: number;
  participantCount: number;
}
