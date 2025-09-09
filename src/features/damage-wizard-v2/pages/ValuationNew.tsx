import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWizardV2 } from '../hooks/useWizardV2';
import { PageShell } from '../components/PageShell';
import { WizardStepperWithNav } from '../components/WizardStepperWithNav';
import { LaborTable } from '../components/LaborTable';
import { PaintTable } from '../components/PaintTable';
import { SparePartsTable } from '../components/SparePartsTable';
import { ValuationSummary } from '../components/ValuationSummary';
import { ValuationActions } from '../components/ValuationActions';
import {
  LaborOperation,
  PaintOperation,
  PaintMaterial,
  SparePart,
  ValuationTotals,
} from '../types';

const ValuationNew = () => {
  const navigate = useNavigate();
  const [, setParams] = useSearchParams();
  const { generateValuation } = useWizardV2();

  // Mock data - replace with real data
  const [laborOperations, setLaborOperations] = useState<LaborOperation[]>([
    {
      id: 'labor-1',
      piece: 'Puerta trasera derecha',
      operation: 'Reparar y enderezar',
      hours: 2.5,
      rate: 42,
      total: 105.0,
      source: 'autodata',
      isManuallyAdjusted: false,
    },
    {
      id: 'labor-2',
      piece: 'Guardabarros trasero',
      operation: 'Sustituir',
      hours: 1.8,
      rate: 42,
      total: 75.6,
      source: 'autodata',
      isManuallyAdjusted: false,
    },
  ]);

  const [paintOperations] = useState<PaintOperation[]>([
    {
      id: 'paint-1',
      piece: 'Puerta delantera izquierda',
      operation: 'Pintar',
      hours: 2.5,
      rate: 45,
      total: 112.5,
    },
    {
      id: 'paint-2',
      piece: 'Capó',
      operation: 'Preparar y pintar',
      hours: 3.0,
      rate: 45,
      total: 135.0,
    },
  ]);

  const [paintMaterials] = useState<PaintMaterial[]>([
    {
      id: 'mat-1',
      piece: 'Puerta delantera izquierda',
      description: 'Imprimación + Base + Barniz',
      units: '0.5L',
      pricePerUnit: 28.0,
      total: 14.0,
    },
    {
      id: 'mat-2',
      piece: 'Capó',
      description: 'Imprimación + Base + Barniz',
      units: '0.8L',
      pricePerUnit: 28.0,
      total: 22.4,
    },
  ]);

  const [spareParts, setSpareParts] = useState<SparePart[]>([
    {
      id: 'part-1',
      piece: 'Retrovisor derecho',
      reference: 'RM001-233-X',
      description: 'Retrovisor exterior derecho completo',
      quantity: 1,
      unitPrice: 125.5,
      total: 125.5,
      isManuallyAdjusted: false,
    },
    {
      id: 'part-2',
      piece: 'Faro delantero izquierdo',
      reference: 'FL001-445-Z',
      description: 'Faro halógeno izquierdo',
      quantity: 1,
      unitPrice: 89.9,
      total: 89.9,
      isManuallyAdjusted: false,
    },
  ]);

  // Calculate totals
  const calculateTotals = (): ValuationTotals => {
    const laborWithoutPaint = laborOperations.reduce((sum, op) => sum + op.total, 0);
    const paintLabor = paintOperations.reduce((sum, op) => sum + op.total, 0);
    const paintMaterialsTotal = paintMaterials.reduce((sum, mat) => sum + mat.total, 0);
    const spareParts_total = spareParts.reduce((sum, part) => sum + part.total, 0);

    const subtotal = laborWithoutPaint + paintLabor + paintMaterialsTotal + spareParts_total;
    const tax = subtotal * 0.21; // 21% IVA
    const total = subtotal + tax;

    return {
      laborWithoutPaint,
      paintLabor,
      paintMaterials: paintMaterialsTotal,
      spareParts: spareParts_total,
      subtotal,
      tax,
      total,
    };
  };

  const totals = calculateTotals();

  // Handlers
  const handleLaborUpdate = (id: string, field: keyof LaborOperation, value: number) => {
    setLaborOperations((prev) =>
      prev.map((op) => {
        if (op.id === id) {
          const updated = { ...op, [field]: value, isManuallyAdjusted: true };
          if (field === 'hours' || field === 'rate') {
            updated.total = updated.hours * updated.rate;
          }
          return updated;
        }
        return op;
      }),
    );
  };

  const handleSparePartUpdate = (id: string, field: keyof SparePart, value: number) => {
    setSpareParts((prev) =>
      prev.map((part) => {
        if (part.id === id) {
          const updated = { ...part, [field]: value, isManuallyAdjusted: true };
          if (field === 'quantity' || field === 'unitPrice') {
            updated.total = updated.quantity * updated.unitPrice;
          }
          return updated;
        }
        return part;
      }),
    );
  };

  const handleBack = () => {
    setParams({ step: 'operations' });
    navigate(`?step=operations`, { replace: true });
  };

  const handleSaveTemplate = () => {
    // Mock save template functionality
    console.log('Saving template...');
  };

  const handleViewSettings = () => {
    // Mock view settings functionality
    console.log('Opening settings...');
  };

  const handleFinalize = async () => {
    try {
      await generateValuation();
      setParams({ step: 'finalize' });
      navigate(`?step=finalize`, { replace: true });
    } catch (error) {
      console.error('Error generating valuation:', error);
    }
  };

  return (
    <>
      <PageShell
        header={
          <WizardStepperWithNav
            currentStep="valuation"
            completedSteps={['intake', 'damages', 'operations']}
          />
        }
        title="Valoración detallada de costes"
        subtitle="ABC-1234"
        content={
          <div className="space-y-6 pb-32">
            {/* Header con total */}
            <div className="text-right">
              <div className="text-primary text-2xl font-bold">{totals.total.toFixed(2)}€</div>
              <div className="text-muted-foreground text-sm">Total presupuesto</div>
            </div>

            {/* Table 1: Labor (Non-Paint) */}
            <LaborTable operations={laborOperations} onUpdateOperation={handleLaborUpdate} />

            {/* Table 2: Paint - Labor and Materials */}
            <PaintTable paintOperations={paintOperations} paintMaterials={paintMaterials} />

            {/* Table 3: Spare Parts */}
            <SparePartsTable spareParts={spareParts} onUpdatePart={handleSparePartUpdate} />

            {/* Final Totals Summary */}
            <ValuationSummary totals={totals} />
          </div>
        }
      />

      {/* Bottom Actions */}
      <ValuationActions
        onBack={handleBack}
        onSaveTemplate={handleSaveTemplate}
        onViewSettings={handleViewSettings}
        onFinalize={handleFinalize}
      />
    </>
  );
};

export default ValuationNew;
