import { InfoIcon } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/atoms/Dialog';

interface DiagnosticContextSectionProps {
  symptoms: string;
  notes?: string;
  questions?: string[];
  answers?: string;
}

export const DiagnosticContextSection = ({
  symptoms,
  notes,
  answers = '',
  questions = [],
}: DiagnosticContextSectionProps) => {
  // Create a summary of symptoms (first 60 characters)
  const symptomsSummary = symptoms.length > 60 ? `${symptoms.substring(0, 60)}...` : symptoms;

  return (
    <div className="rounded-md bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-3 rounded-md bg-blue-100 p-2">
            <InfoIcon className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <h2 className="text-sm font-medium sm:text-lg">
            Contexto <span className="hidden sm:inline">del Diagnóstico</span>
          </h2>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="link" className="sm:pr-auto pr-1">
              Ver detalles
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Contexto del Diagnóstico</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 sm:py-2">
              <div>
                <h3 className="text-sm font-medium sm:text-base">Síntomas Reportados</h3>
                <p className="text-muted text-xs sm:text-base">{symptoms}</p>
              </div>

              {notes && (
                <div>
                  <h3 className="text-sm font-medium sm:text-base">Notas Adicionales</h3>
                  <p className="text-muted text-xs sm:text-base">{notes}</p>
                </div>
              )}

              {questions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium sm:text-base">Preguntas</h3>
                  {questions.map((question, index) => (
                    <p key={index} className="text-muted text-xs sm:text-base">
                      {question}
                    </p>
                  ))}
                </div>
              )}
              {answers && (
                <div>
                  <h3 className="text-base font-medium">Respuestas a Preguntas Guiadas</h3>
                  <div className="space-y-3">
                    <div className="text-muted whitespace-pre-line">
                      {answers}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-muted text-xs sm:text-base">
        Síntomas: {symptomsSummary}
        {symptoms.length > 60 && (
          <span className="text-gray-500"> Respuestas a preguntas detalladas disponibles.</span>
        )}
      </p>
    </div>
  );
};
