import { useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useClientAssessment } from '../hooks/useClientAssessment';
import { ChatInterface } from '../components/ChatInterface';
import { ClientComplete } from '../components/ClientComplete';

export const ClientLanding = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  // Extract token and carId from URL query params
  // These are needed for the client to call backend APIs
  const urlToken = searchParams.get('t') || undefined;
  const urlCarId = searchParams.get('car') || undefined;

  const {
    assessment,
    questions,
    answers,
    isLoading,
    isComplete,
    isGeneratingDiagnosis,
    error,
    submitAnswer,
  } = useClientAssessment(id, { token: urlToken, carId: urlCarId });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 text-lg">Cargando información...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !assessment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <div className="rounded-lg bg-red-50 border border-red-200 p-6">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-900 mb-2">
              No se pudo cargar la información
            </h2>
            <p className="text-red-700">
              {error || 'Por favor, verifica el enlace.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Completion state - show when complete OR while generating diagnosis
  // The client doesn't need to know about the AI processing in the background
  if (isComplete || isGeneratingDiagnosis) {
    return <ClientComplete clientName={assessment.clientName} />;
  }

  // Main chat interface
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900">
            Asistencia en Carretera
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {/* Limpiar el síntoma: quitar el contexto técnico [ASISTENCIA CARRETERA...] */}
            {assessment.symptom?.split('[ASISTENCIA')[0]?.trim() || assessment.symptom}
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 max-w-4xl mx-auto w-full">
        <ChatInterface
          questions={questions}
          answers={answers}
          onAnswerSubmit={submitAnswer}
          isLoading={isLoading}
        />
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <p className="text-xs text-gray-500 text-center max-w-4xl mx-auto">
          Tus respuestas ayudarán al técnico a diagnosticar el problema más rápido
        </p>
      </div>
    </div>
  );
};
