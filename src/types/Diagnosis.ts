export type Diagnosis = {
  _id?: string;
  carId: string;
  fault: string;
  notes: string;
  answers: string;
  processedAnswers: string;
  questions: string[];
  status: string;
  processedFault: {
    symptomCleaned: string;
    category: string;
    potentialObdCodes: string[];
    notes: string;
  };
  preliminary: {
    moreReasonsRequestsQuantity: number;
    possibleReasons: {
      _id: string;
      title: string;
      probability: string;
      reasonDetails: string;
      diagnosticRecommendations: string[];
      requiredTools: string[];
      electricalDiagrams?: DocumentLink[];
    }[];
    oldPossibleReasons?: string[];
    newPossibleReasons?: string[];
  };
  finalNotes: string;
  diagnosis: {
    conclusion: {
      recommendations: string[];
      nextSteps: string[];
    };
    estimatedBudget: {
      parts: [
        {
          name: string;
          price: number;
          quality: string;
        },
      ];
      partsDiagrams: DocumentLink[];
      laborHours: number;
    };
    confirmedFailures: [
      {
        title: string;
        steps: string[];
        tools: string[];
        resources: DocumentLink[];
        repairManuals: DocumentLink[];
        electricalDiagrams?: DocumentLink[];
      },
    ];
    alternativeFailures: [
      {
        title: string;
        probability: string;
        tests: string[];
        resources: DocumentLink[];
      },
    ];
  };
  wasUseful?: boolean;
  createdAt: Date;
  updatedAt: Date;
  rating?: {
    _id: string;
    notes: string;
    scoreStrictFormat: number;
  };
  car?: {
    _id: string;
    model: string;
    brand: string;
    plate: string;
    vinCode: string;
    workshopId: string;
    kilometers: number;
    fuel: string;
    lastRevision: Date;
  };
  obdCodes?: string[];
  createdBy?: {
    name: string;
    avatar?: string;
  };
  markedAsRepairedBy?: string;
  // REMOVED: electricalDiagrams moved to fault level (preliminary.possibleReasons and diagnosis.confirmedFailures)
  // electricalDiagrams?: DocumentLink[];
};

export type DocumentLink = {
  label: string;
  url: string;
  type: 'video' | 'document';
};
