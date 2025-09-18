export interface ClientInfo {
    firstName: string | null;
    lastName: string | null;
    country: string | null;
    phone: string | null;
    phoneType: string | null;
    areaCode: string | null;
    acceptsSMS: boolean | null;
    email: string | null;
}

export interface AppointmentTime {
    date: string | null;
    time: string | null;
    agent: {
        id: string | null;
        name: string | null;
    };
    duration: string | null;
}

export interface Appointment {
    _id?: string;
    status: string;
    client: ClientInfo;
    reception: AppointmentTime;
    isDeleted?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface AppointmentsResponse {
    success: boolean;
    data: Appointment[];
    total: number;
}
