interface ValuationCostsSummaryProps {
  laborTotal: number;
  paintLaborTotal: number;
  paintMaterialsTotal: number;
  partsTotal: number;
  showLaborSubtotal: boolean;
  showPaintSubtotal: boolean;
  showPartsSubtotal: boolean;
}

export const ValuationCostsSummary = ({
  laborTotal,
  paintLaborTotal,
  paintMaterialsTotal,
  partsTotal,
  showLaborSubtotal,
  showPaintSubtotal,
  showPartsSubtotal,
}: ValuationCostsSummaryProps) => {
  const grandTotal = laborTotal + paintLaborTotal + paintMaterialsTotal + partsTotal;

  return (
    <div>
      <h4 className="mb-3 font-semibold text-[#111827]">RESUMEN DE COSTES TOTALES</h4>
      <div className="rounded-lg bg-[#f9fafb] p-4 sm:p-6">
        <div className="ml-auto max-w-md space-y-2 text-sm">
          {showLaborSubtotal && (
            <div className="flex justify-between">
              <span>Subtotal Mano de Obra:</span>
              <span className="font-medium">€{laborTotal.toFixed(2)}</span>
            </div>
          )}
          {showPaintSubtotal && (
            <div className="flex justify-between">
              <span>Subtotal Pintura:</span>
              <span className="font-medium">
                €{(paintLaborTotal + paintMaterialsTotal).toFixed(2)}
              </span>
            </div>
          )}
          {showPartsSubtotal && (
            <div className="flex justify-between">
              <span>Subtotal Recambios:</span>
              <span className="font-medium">€{partsTotal.toFixed(2)}</span>
            </div>
          )}
          <hr className="my-2 border-[#e5e7eb]" />
          <div className="flex justify-between font-medium">
            <span>BASE IMPONIBLE:</span>
            <span>€{grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>IVA (21%):</span>
            <span className="font-medium">€{(grandTotal * 0.21).toFixed(2)}</span>
          </div>
          <hr className="my-2 border-[#e5e7eb]" />
          <div className="flex justify-between text-base font-bold sm:text-lg">
            <span>TOTAL VALORACIÓN:</span>
            <span>€{(grandTotal * 1.21).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
