
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
  waitingList?: string[]; // 新增：排队等候名单
  deletionRequests?: string[]; 
  maxParticipants: number;
  status?: 'active' | 'completed'; // 新增：活动状态
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
