import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { useWizardV2 } from '../hooks/useWizardV2';
import { PageShell } from '../components/PageShell';
import { SectionPaper } from '../components/SectionPaper';
import { WizardStepperWithNav } from '../components/WizardStepperWithNav';
import { ValuationTable } from '../components/ValuationTable';

import { BackendLaborOutput, BackendPaintWork } from '../types/backend.types';
import { operationLabels } from '@/types/DamageAssessment';

const getOperationLabel = (operationCode: string): string => {
  return operationLabels[operationCode] || operationCode;
};

const Valuation = () => {
  const navigate = useNavigate();
  const [, setParams] = useSearchParams();
  const { state, generateValuation, finalizeAssessment } = useWizardV2();
  const [isGenerating, setIsGenerating] = useState(false);
  const hasGeneratedValuation = useRef(false);

  // Cargar valoración si no existe (solo una vez)
  useEffect(() => {
    console.log('🔄 Valuation useEffect triggered:', {
      assessmentId: state.assessmentId,
      hasValuation: !!state.valuation,
      isGenerating,
      hasGenerated: hasGeneratedValuation.current,
    });

    // Si ya tenemos valoración, no necesitamos generar
    if (state.valuation) {
      console.log('✅ Valuation already exists, skipping generation');
      return;
    }

    // Solo generar si no existe y no se ha generado antes
    if (state.assessmentId && !state.valuation && !isGenerating && !hasGeneratedValuation.current) {
      console.log('✅ Starting valuation generation...');
      hasGeneratedValuation.current = true;
      handleGenerateValuation();
    }
  }, [state.assessmentId]); // Solo depende del assessmentId

  const handleGenerateValuation = async () => {
    console.log('🚀 handleGenerateValuation called');
    try {
      setIsGenerating(true);
      await generateValuation();
      console.log('✅ Valuation generated successfully');
    } catch (error) {
      console.error('❌ Error generating valuation:', error);
      // Reset flag en caso de error para permitir reintento
      hasGeneratedValuation.current = false;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinalize = async () => {
    try {
      await finalizeAssessment();
      setParams({ step: 'finalize' });
      navigate(`?step=finalize`, { replace: true });
    } catch (error) {
      console.error('Error finalizing assessment:', error);
      // Fallback a navegación directa en caso de error
      console.warn('Fallback: navegando a finalize después de error');
      setParams({ step: 'finalize' });
      navigate(`?step=finalize`, { replace: true });
    }
  };

  const sourceConfig = {
    autodata: { color: 'bg-blue-100 text-blue-800', label: 'Autodata' },
    segment_lookup: { color: 'bg-green-100 text-green-800', label: 'Segment' },
    calc: { color: 'bg-purple-100 text-purple-800', label: 'Calc' },
    user_override: { color: 'bg-orange-100 text-orange-800', label: 'Override' },
    no_data: { color: 'bg-red-100 text-red-800', label: 'No Data' },
  };

  // Datos de mano de obra
  const laborData = state.valuation?.laborOutput
    ? state.valuation.laborOutput.map((item: BackendLaborOutput) => ({
        operation: `${getOperationLabel(item.mainOperation?.operation || '')} ${item.partName || 'Pieza sin nombre'}`,
        hours: item.mainOperation?.estimatedHours || 0,
        rate: 38, // Tarifa por defecto
        total: (item.mainOperation?.estimatedHours || 0) * 38,
        source: (
          <Badge
            variant="outline"
            className={
              sourceConfig[item.mainOperation?.source as keyof typeof sourceConfig]?.color ||
              sourceConfig.no_data.color
            }
          >
            {sourceConfig[item.mainOperation?.source as keyof typeof sourceConfig]?.label ||
              'Unknown'}
          </Badge>
        ),
      }))
    : [];

  // Datos de pintura
  const paintData = state.valuation?.paintWorks
    ? state.valuation.paintWorks.map((item: BackendPaintWork) => ({
        partName: item.partName || 'Pieza sin nombre',
        job: 'Trabajo de pintura',
        paintHours: item.labor?.hours || 0,
        paintLaborTotal: item.labor?.total || 0,
        unitPrice: item.materials?.unitPrice || 0,
        materialsTotal: item.materials?.total || 0,
        total: item.totalCost || 0,
      }))
    : [];

  // Datos de recambios
  const partsData = state.valuation?.parts
    ? state.valuation.parts.map((item: Record<string, unknown>) => ({
        ref: (item.ref as string) || 'REF-001',
        partName: (item.partName as string) || 'Pieza',
        unitPrice: (item.unitPrice as number) || 0,
        qty: (item.qty as number) || 1,
        total: (item.total as number) || 0,
      }))
    : [];

  // Debug: Log del estado de valoración
  console.log('🔍 Valuation state:', {
    hasValuation: !!state.valuation,
    laborOutput: state.valuation?.laborOutput?.length || 0,
    paintWorks: state.valuation?.paintWorks?.length || 0,
    parts: state.valuation?.parts?.length || 0,
    compact: state.valuation?.compact,
  });

  // Mostrar loading mientras se genera la valoración
  if (isGenerating) {
    return (
      <PageShell
        header={
          <WizardStepperWithNav
            currentStep="valuation"
            completedSteps={['intake', 'damages', 'operations']}
          />
        }
        title="Valoración del peritaje"
        subtitle="Calculando costes y tiempos..."
        content={
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Generando valoración...</p>
            </div>
          </div>
        }
      />
    );
  }

  return (
    <PageShell
      header={
        <WizardStepperWithNav
          currentStep="valuation"
          completedSteps={['intake', 'damages', 'operations']}
        />
      }
      title="Valoración del peritaje"
      subtitle="Revisa los costes calculados para cada operación"
      content={
        <div className="space-y-6">
          {/* Table 1: Mano de obra (sin pintura) */}
          <SectionPaper title="Mano de obra (sin pintura)">
            <ValuationTable
              columns={[
                { key: 'operation', header: 'Operación' },
                { key: 'hours', header: 'Horas MO' },
                { key: 'rate', header: 'Tarifa (€/h)' },
                { key: 'total', header: 'Total MO (€)' },
              ]}
              data={laborData}
              emptyStateMessage="No se consideraron necesarios trabajos de mano de obra"
            />
          </SectionPaper>

          {/* Table 2: Pintura */}
          <SectionPaper title="Pintura - Mano de obra y materiales">
            <ValuationTable
              columns={[
                { key: 'partName', header: 'Pieza' },
                { key: 'job', header: 'Trabajo' },
                { key: 'paintHours', header: 'Horas Pintura' },
                { key: 'paintLaborTotal', header: 'MO Pintura (€)' },
                { key: 'unitPrice', header: 'Precio Material' },
                { key: 'materialsTotal', header: 'Total Materiales (€)' },
                { key: 'total', header: 'Total (€)' },
              ]}
              data={paintData}
              emptyStateMessage="No se consideraron necesarios trabajos de pintura"
            />
          </SectionPaper>

          {/* Table 3: Recambios */}
          {partsData.length > 0 && (
            <SectionPaper title="Recambios">
              <ValuationTable
                columns={[
                  { key: 'ref', header: 'Referencia' },
                  { key: 'partName', header: 'Pieza' },
                  { key: 'unitPrice', header: 'Precio Unitario' },
                  { key: 'qty', header: 'Cantidad' },
                  { key: 'total', header: 'Total (€)' },
                ]}
                data={partsData}
              />
            </SectionPaper>
          )}

          {/* Totales */}
          <SectionPaper title="Resumen de costes">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Mano de obra</p>
                  <p className="mt-1 text-2xl font-bold text-blue-600">
                    €
                    {(state.valuation?.compact?.totals as Record<string, number>)?.labor ||
                      laborData
                        .reduce(
                          (sum, item) => sum + (typeof item.total === 'number' ? item.total : 0),
                          0,
                        )
                        .toFixed(2)}
                    €
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-green-50 p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Pintura</p>
                  <p className="mt-1 text-2xl font-bold text-green-600">
                    €
                    {(state.valuation?.compact?.totals as Record<string, number>)?.paintLabor ||
                      paintData
                        .reduce(
                          (sum, item) => sum + (typeof item.total === 'number' ? item.total : 0),
                          0,
                        )
                        .toFixed(2)}
                    €
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-purple-50 p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    €
                    {(state.valuation?.compact?.totals as Record<string, number>)?.grandTotal ||
                      (
                        laborData.reduce(
                          (sum, item) => sum + (typeof item.total === 'number' ? item.total : 0),
                          0,
                        ) +
                        paintData.reduce(
                          (sum, item) => sum + (typeof item.total === 'number' ? item.total : 0),
                          0,
                        )
                      ).toFixed(2)}
                    €
                  </p>
                </div>
              </div>
            </div>
          </SectionPaper>
        </div>
      }
      footer={
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setParams({ step: 'operations' });
              navigate(`?step=operations`, { replace: true });
            }}
          >
            Volver a Operaciones
          </Button>
          <Button onClick={handleFinalize} className="px-6">
            Finalizar Peritaje
          </Button>
        </div>
      }
    />
  );
};

export default Valuation;
