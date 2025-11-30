import { useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, Loader2, Brain } from 'lucide-react';
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

  // Generating diagnosis state - show while AI is processing
  if (isGeneratingDiagnosis) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-center space-y-6 p-8">
          <div className="relative">
            <Brain className="h-16 w-16 text-purple-600 mx-auto animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-20 w-20 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">
              Generando diagnóstico...
            </h2>
            <p className="text-gray-600">
              Nuestra IA está analizando tus respuestas
            </p>
          </div>
          <div className="flex justify-center gap-1">
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
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

  // Completion state
  if (isComplete) {
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
            {assessment.symptom}
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
