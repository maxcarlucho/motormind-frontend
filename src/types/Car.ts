export type Car = {
  // Campos comunes
  _id: string;
  vinCode: string;
  brand: string;
  model: string;
  workshopId: string;
  plate: string;

  // Campos opcionales
  year?: string;
  kilometers?: number;
  fuel?: string;
  lastRevision?: string;
  data?: Record<string, unknown>;

  // Campos del backend
  description?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

export type CreateCar = {
  vinCode?: string;
  brand?: string;
  model?: string;
  year?: string;
  plate?: string;
  kilometers?: number;
  fuel?: string;
  lastRevision?: string;
  data?: Record<string, unknown>;
  description?: string;
};
