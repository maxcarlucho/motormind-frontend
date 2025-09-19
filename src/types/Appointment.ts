import { Workshop } from "./Workshop";
import { User } from "./User";

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
    carId?: string | null;
    diagnosisId?: string | null;
    status: string;
    client: ClientInfo;
    reception: AppointmentTime;
    isDeleted?: boolean;
    createdAt: Date;
    updatedAt: Date;
    diagnosisStatus?: string | null;
    createdBy?: Partial<User>;
    workshopId?: Partial<Workshop>;
    car?: {
        _id: string;
        brand: string;
        model: string;
        plate: string;
        vinCode: string;
        workshopId: string;
    };
    diagnosis?: {
        status: string;
        symptoms: string;
    } | null;
}

export interface AppointmentsResponse {
    success: boolean;
    data: Appointment[];
    total: number;
}
