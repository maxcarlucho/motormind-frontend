import { DIAGNOSIS_STATUS, DIAGNOSIS_STATUS_LABELS, DIAGNOSIS_STATUS_COLORS, DiagnosisStatus, ASSESSMENT_STATUS_LABELS, AssessmentStatus } from '@/constants';
import { Diagnosis } from '@/types/Diagnosis';

export const formatDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return `Hoy, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (isYesterday) {
    return `Ayer, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
};

export const formatToddmmyyyy = (date: Date) => {
  if (!date) return '';
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

export const formatAppointmentDateTime = (date: string, time: string): string => {
  if (!date || !time) return '—';

  try {
    // Parsear la fecha (formato YYYY-MM-DD)
    const dateObj = new Date(date);

    // Verificar que la fecha es válida
    if (isNaN(dateObj.getTime())) {
      return '—';
    }

    // Formatear fecha como dd/mm/yy
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear().toString().slice(-2); // Últimos 2 dígitos del año

    // El time ya viene en formato HH:MM, solo necesitamos concatenar
    return `${day}/${month}/${year} ${time}`;
  } catch (error) {
    console.error('Error formatting appointment date/time:', error);
    return '—';
  }
};

export const parseSpanishDate = (dateString: string): Date | undefined => {
  // Parse date in format DD/MM/YYYY
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS Date
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return undefined;
};

export const capitalizeFirstLetter = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
};

export const diagnosisLink = (diagnosis: Diagnosis, back?: boolean) => {
  const mainLink = `/cars/${diagnosis.carId}/diagnosis/${diagnosis._id}`;

  let path = '';

  if (diagnosis.status === DIAGNOSIS_STATUS.GUIDED_QUESTIONS) {
    path = back ? 'questions?back=true' : 'questions';
  } else if (diagnosis.status === DIAGNOSIS_STATUS.ASSIGN_OBD_CODES) {
    path = back ? 'obd-codes?back=true' : 'obd-codes';
  } else if (diagnosis.status === DIAGNOSIS_STATUS.PRELIMINARY) {
    path = back ? 'preliminary-report?back=true' : 'preliminary-report';
  } else if (
    diagnosis.status === DIAGNOSIS_STATUS.IN_REPARATION ||
    diagnosis.status === DIAGNOSIS_STATUS.REPAIRED
  ) {
    path = back ? 'final-report?back=true' : 'final-report';
  }

  return `${mainLink}/${path}`;
};

export const onChangePrice = (
  e: React.ChangeEvent<HTMLInputElement>,
  update: (value: number) => void,
) => {
  const value = e.target.value;

  // Si está vacío, permitir borrar
  if (value === '') {
    update(0);
    return;
  }

  // Eliminar ceros a la izquierda y actualizar el input
  const cleanValue = value.replace(/^0+/, '') || '0';
  if (cleanValue !== value) {
    e.target.value = cleanValue;
  }

  // Convertir a número y validar
  const numValue = parseFloat(cleanValue);
  if (!isNaN(numValue) && numValue >= 0) {
    update(numValue);
  }
};

/**
 * Obtiene el label amigable para un estado de diagnosis
 * @param status - El estado del diagnosis
 * @returns El label amigable o el estado original si no se encuentra
 */
export const getDiagnosisStatusLabel = (status: string): string => {
  return DIAGNOSIS_STATUS_LABELS[status as DiagnosisStatus] || status;
};

/**
 * Obtiene el label amigable para un estado de assessment
 * @param status - El estado del assessment
 * @returns El label amigable o el estado original si no se encuentra
 */
export const getAssessmentStatusLabel = (status: string): string => {
  return ASSESSMENT_STATUS_LABELS[status as AssessmentStatus] || status;
};

/**
 * Obtiene las clases CSS de color para un estado de diagnosis
 * @param status - El estado del diagnosis
 * @returns Las clases CSS de color o el color por defecto si no se encuentra
 */
export const getDiagnosisStatusColor = (status: string): string => {
  return DIAGNOSIS_STATUS_COLORS[status as DiagnosisStatus] || 'bg-gray-100 text-gray-800 border-gray-200';
};
