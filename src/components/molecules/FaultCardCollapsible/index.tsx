import { useState } from 'react';
import { Badge } from '@/components/atoms/Badge';
import {
  LightbulbIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  WrenchIcon,
  BoxIcon,
  FileTextIcon,
} from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { PROBABILITY_LEVELS } from '@/constants';
import { ProbabilityLevel } from '@/types/Probability';
import { DocumentLink } from '@/types/Diagnosis';
import PartDiagramItem from '@/components/molecules/PartDiagramItem';

interface FaultCardCollapsibleProps {
  title: string;
  probability: ProbabilityLevel;
  reasoning: string;
  recommendations: string[];
  tools: string[];
  electricalDiagrams?: DocumentLink[];
  onElectricalDiagramClick?: (url: string, label: string) => void;
}

export default function FaultCardCollapsible({
  title,
  probability,
  reasoning,
  recommendations,
  tools,
  electricalDiagrams,
  onElectricalDiagramClick,
}: FaultCardCollapsibleProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Define color based on probability
  const getProbabilityColor = (prob: ProbabilityLevel) => {
    switch (prob) {
      case PROBABILITY_LEVELS.HIGH:
        return 'bg-red-100 text-red-800 border-red-200';
      case PROBABILITY_LEVELS.MEDIUM:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case PROBABILITY_LEVELS.LOW:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  // Truncate reasoning for collapsed view
  const truncateText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="rounded-md border border-gray-200 bg-white p-3 shadow-sm transition-all duration-200 sm:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-1 sm:gap-2">
        <h3 className="text-sm font-semibold text-gray-900 sm:text-lg">{title}</h3>
        <Badge
          variant="outline"
          className={`${getProbabilityColor(probability)} px-2 py-0.5 font-medium sm:px-3 sm:py-1`}
        >
          Probabilidad: {probability}
        </Badge>
      </div>

      <div className="space-y-2 sm:space-y-4">
        {/* Reasoning Section - Always visible but truncated when collapsed */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <LightbulbIcon className="h-4 w-4 text-amber-500 sm:h-5 sm:w-5" />
            <h4 className="text-sm font-medium sm:text-base">Razonamiento IA</h4>
          </div>
          <p className="text-muted pl-5 text-xs sm:pl-7 sm:text-base">
            {isExpanded ? reasoning : truncateText(reasoning)}
          </p>
        </div>

        {/* Expanded Content */}
        <div
          className={`space-y-4 overflow-hidden transition-all duration-300 ${
            isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          {/* Recommendations Section */}
          {!!recommendations.length && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <WrenchIcon className="text-primary h-5 w-5" />
                <h4 className="text-sm font-medium sm:text-base">Recomendaciones Diagnósticas</h4>
              </div>
              <ul className="text-muted list-disc space-y-1 pl-6 text-xs sm:pl-12 sm:text-base">
                {recommendations.map((recommendation, index) => (
                  <li key={index}>{recommendation}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tools Section */}
          {!!tools.length && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BoxIcon className="text-muted h-5 w-5" />
                <h4 className="text-sm font-medium sm:text-base">Herramientas Necesarias</h4>
              </div>
              <ul className="text-muted list-disc space-y-1 pl-6 text-xs sm:pl-12 sm:text-base">
                {tools.map((tool, index) => (
                  <li key={index}>{tool}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Electrical Diagrams Section */}
          {electricalDiagrams && electricalDiagrams.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileTextIcon className="h-5 w-5 text-blue-600" />
                <h4 className="text-sm font-medium sm:text-base">Diagramas Eléctricos</h4>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {electricalDiagrams.map((diagram, index) => (
                  <PartDiagramItem
                    key={index}
                    title={diagram.label}
                    type="document"
                    onClick={() => {
                      if (onElectricalDiagramClick) {
                        onElectricalDiagramClick(diagram.url, diagram.label);
                      } else {
                        window.open(diagram.url, '_blank');
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Expand/Collapse Trigger */}
        <Button
          type="button"
          variant="ghost"
          className="text-primary ml-auto flex h-auto items-center !p-0 transition-colors"
          onClick={toggleExpand}
        >
          {isExpanded ? (
            <>
              Ocultar Detalles
              <ChevronUpIcon className="h-4 w-4" />
            </>
          ) : (
            <>
              Ver Detalles
              <ChevronDownIcon className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
