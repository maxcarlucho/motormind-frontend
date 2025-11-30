import { useParams } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useClientAssessment } from '../hooks/useClientAssessment';
import { ChatInterface } from '../components/ChatInterface';
import { ClientComplete } from '../components/ClientComplete';
import { useAccessToken } from '../components/RequireAccessToken';

export const ClientLanding = () => {
  const { id } = useParams<{ id: string }>();

  // Get validated token data from RequireAccessToken context
  // The token has already been validated for: correct caseId, not expired, type='client'
  // The raw token is passed to useClientAssessment for API calls (works in incognito)
  const { carId: tokenCarId, diagnosisId: tokenDiagnosisId, token: urlToken } = useAccessToken();

  const {
    assessment,
    questions,
    answers,
    isLoading,
    isComplete,
    isGeneratingDiagnosis,
    error,
    submitAnswer,
  } = useClientAssessment(id, { carId: tokenCarId, diagnosisId: tokenDiagnosisId, urlToken });

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
      <div className="flex-1 max-w-4xl mx-auto w-full overflow-hidden">
        <ChatInterface
          questions={questions}
          answers={answers}
          onAnswerSubmit={submitAnswer}
          isLoading={isLoading}
          clientName={assessment.clientName}
          symptom={assessment.symptom?.split('[ASISTENCIA')[0]?.trim()}
        />
      </div>
    </div>
  );
};
