import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { useWizardV2 } from '../hooks/useWizardV2';
import { PageShell } from '../components/PageShell';
import { SectionPaper } from '../components/SectionPaper';
import { WizardStepperWithNav } from '../components/WizardStepperWithNav';
import { ValuationTable } from '../components/ValuationTable';

import { BackendLaborOutput, BackendPaintWork } from '../types/backend.types';
import { operationLabels } from '@/types/DamageAssessment';
import { ArrowLeftIcon } from 'lucide-react';

const Valuation = () => {
  const navigate = useNavigate();

  const { state, generateValuation, finalizeAssessment } = useWizardV2();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const hasGeneratedValuation = useRef(false);

  const handleGenerateValuation = useCallback(async () => {
    try {
      setIsGenerating(true);
      await generateValuation();
    } catch (error) {
      console.error('Error generating valuation:', error);
      hasGeneratedValuation.current = false;
    } finally {
      setIsGenerating(false);
    }
  }, [generateValuation]);

  useEffect(() => {
    if (state.valuation) {
      return;
    }

    if (state.assessmentId && !state.valuation && !isGenerating && !hasGeneratedValuation.current) {
      hasGeneratedValuation.current = true;
      handleGenerateValuation();
    }
  }, [state.assessmentId, state.valuation, isGenerating, handleGenerateValuation]);

  const handleFinalize = async () => {
    try {
      setIsFinalizing(true);
      await finalizeAssessment();
      navigate(`?step=finalize`, { replace: true });
    } catch (error) {
      console.error('Error finalizing assessment:', error);
      navigate(`?step=finalize`, { replace: true });
    } finally {
      setIsFinalizing(false);
    }
  };

  const sourceConfig = {
    autodata: { color: 'bg-blue-100 text-blue-800', label: 'Autodata' },
    segment_lookup: { color: 'bg-green-100 text-green-800', label: 'Segment' },
    calc: { color: 'bg-purple-100 text-purple-800', label: 'Calc' },
    user_override: { color: 'bg-orange-100 text-orange-800', label: 'Override' },
    no_data: { color: 'bg-red-100 text-red-800', label: 'No Data' },
  };

  // Datos de mano de obra agrupados por operación y pieza
  const laborData = state.valuation?.laborOutput
    ? (() => {
        // Agrupar por operación y pieza
        const laborByOperationAndPart = new Map<
          string,
          { hours: number; total: number; source: string }
        >();

        state.valuation.laborOutput.forEach((item: BackendLaborOutput) => {
          const operation = item.mainOperation?.operation || '';
          const partName = item.partName || 'Pieza sin nombre';
          const key = `${operation}|${partName}`;
          const hours = item.mainOperation?.estimatedHours || 0;
          const total = (item.mainOperation?.estimatedHours || 0) * 38;
          const source = item.mainOperation?.source || 'no_data';

          if (laborByOperationAndPart.has(key)) {
            const existing = laborByOperationAndPart.get(key)!;
            existing.hours += hours;
            existing.total += total;
          } else {
            laborByOperationAndPart.set(key, { hours, total, source });
          }
        });

        // Convertir a array con datos agrupados
        return Array.from(laborByOperationAndPart.entries()).map(([key, data]) => {
          const [operation, partName] = key.split('|', 2);
          return {
            operation: `${operationLabels[operation] || operation} ${partName}`,
            hours: `${data.hours.toFixed(2)} h`,
            rate: 38, // Tarifa por defecto
            total: data.total,
            source: (
              <Badge
                variant="outline"
                className={
                  sourceConfig[data.source as keyof typeof sourceConfig]?.color ||
                  sourceConfig.no_data.color
                }
              >
                {sourceConfig[data.source as keyof typeof sourceConfig]?.label || 'Unknown'}
              </Badge>
            ),
          };
        });
      })()
    : [];

  // Datos de pintura separados en mano de obra y materiales
  const paintData = state.valuation?.paintWorks
    ? (() => {
        const paintDataArray: (Record<string, unknown> & {
          _isSubtitle?: boolean;
          _subtitleText?: string;
        })[] = [];

        // Agregar subtítulo de mano de obra
        paintDataArray.push({
          _isSubtitle: true,
          _subtitleText: 'MANO DE OBRA DE PINTURA',
        });

        // Agrupar datos de mano de obra por pieza
        const laborByPart = new Map<string, { hours: number; total: number }>();
        state.valuation.paintWorks.forEach((item: BackendPaintWork) => {
          const partName = item.partName || 'Pieza sin nombre';
          const hours = item.labor?.hours || 0;
          const total = item.labor?.total || 0;

          if (laborByPart.has(partName)) {
            const existing = laborByPart.get(partName)!;
            existing.hours += hours;
            existing.total += total;
          } else {
            laborByPart.set(partName, { hours, total });
          }
        });

        // Agregar datos agrupados de mano de obra
        laborByPart.forEach((data, partName) => {
          paintDataArray.push({
            description: `Pintar ${partName}`,
            units: `${data.hours.toFixed(2)} h`,
            price: 38, // Tarifa por hora de pintura
            total: data.total,
          });
        });

        // Agregar subtítulo de materiales
        paintDataArray.push({
          _isSubtitle: true,
          _subtitleText: 'MATERIALES DE PINTURA',
        });

        // Agrupar datos de materiales por pieza
        const materialsByPart = new Map<string, { units: number; price: number; total: number }>();
        state.valuation.paintWorks.forEach((item: BackendPaintWork) => {
          const partName = item.partName || 'Pieza sin nombre';
          const price = item.materials?.unitPrice || 0;
          const total = item.materials?.total || 0;

          if (materialsByPart.has(partName)) {
            const existing = materialsByPart.get(partName)!;
            // Las unidades NO se suman, siempre es 1 por pieza
            existing.total += total;
            // Para el precio, tomamos el promedio si hay diferentes precios
            existing.price = (existing.price + price) / 2;
          } else {
            materialsByPart.set(partName, { units: 1, price, total });
          }
        });

        // Agregar datos agrupados de materiales
        materialsByPart.forEach((data, partName) => {
          paintDataArray.push({
            description: `Pintar ${partName}`,
            units: `${data.units.toFixed(2)}`,
            price: data.price,
            total: data.total,
          });
        });

        return paintDataArray;
      })()
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

  // Mostrar loading mientras se genera la valoración
  if (isGenerating) {
    return (
      <PageShell
        header={
          <WizardStepperWithNav
            currentStep="valuation"
            completedSteps={['intake', 'damages', 'operations']}
            loading={true}
          />
        }
        title="Valoración del peritaje"
        subtitle="Calculando costes y tiempos..."
        loading={true}
        loadingTitle="Generando valoración"
        loadingDescription="Estamos calculando los costes y tiempos de reparación para tu peritaje"
        content={<div />}
      />
    );
  }

  // Mostrar loading mientras se finaliza el peritaje
  if (isFinalizing) {
    return (
      <PageShell
        header={
          <WizardStepperWithNav
            currentStep="valuation"
            completedSteps={['intake', 'damages', 'operations']}
            loading={true}
          />
        }
        title="Valoración del peritaje"
        subtitle="Finalizando peritaje..."
        loading={true}
        loadingTitle="Finalizando peritaje"
        loadingDescription="Estamos completando el peritaje y preparando el informe final"
        content={<div />}
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
          <SectionPaper title="Mano de obra">
            <ValuationTable
              columns={[
                { key: 'operation', header: 'Descripción' },
                { key: 'hours', header: 'Uds.' },
                { key: 'rate', header: 'Precio (€)' },
                { key: 'total', header: 'Total (€)' },
              ]}
              data={laborData}
              emptyStateMessage="No se consideraron necesarios trabajos de mano de obra"
            />
          </SectionPaper>

          {/* Table 2: Pintura */}
          <SectionPaper title="Pintura">
            <ValuationTable
              columns={[
                { key: 'description', header: 'Descripción' },
                { key: 'units', header: 'Uds.' },
                { key: 'price', header: 'Precio(€)' },
                { key: 'total', header: 'Total(€)' },
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
        <div className="flex w-full flex-col gap-3 md:flex-row md:justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(`?step=operations`, { replace: true })}
            className="w-full md:w-auto"
          >
            <ArrowLeftIcon className="h-4 w-4 sm:mr-2" />
            Volver a Operaciones
          </Button>
          <Button onClick={handleFinalize} className="w-full px-6 md:w-auto">
            Finalizar Peritaje
          </Button>
        </div>
      }
    />
  );
};

export default Valuation;
