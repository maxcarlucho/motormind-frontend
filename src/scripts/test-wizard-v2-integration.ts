/**
 * Script de prueba para el flujo integrado del Wizard V2
 * Simula el flujo completo end-to-end con backend real
 */

import axios from 'axios';
import { apiUrl } from '@/constants/env';

// Configurar axios con token
const api = axios.create({
    baseURL: apiUrl,
    headers: { 'Content-Type': 'application/json' },
});

// Usar token de localStorage si está disponible
const token = localStorage.getItem('token');
if (token) {
    api.defaults.headers.Authorization = `Bearer ${token}`;
}

interface TestResult {
    step: string;
    success: boolean;
    data?: any;
    error?: string;
    duration: number;
}

class WizardV2IntegrationTest {
    private results: TestResult[] = [];
    private assessmentId?: string;

    private async measureStep<T>(stepName: string, fn: () => Promise<T>): Promise<T> {
        const start = Date.now();
        try {
            const result = await fn();
            const duration = Date.now() - start;

            this.results.push({
                step: stepName,
                success: true,
                data: result,
                duration,
            });

            console.log(`✅ ${stepName} - ${duration}ms`);
            return result;
        } catch (error) {
            const duration = Date.now() - start;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            this.results.push({
                step: stepName,
                success: false,
                error: errorMessage,
                duration,
            });

            console.error(`❌ ${stepName} - ${duration}ms - ${errorMessage}`);
            throw error;
        }
    }

    async testIntake() {
        const result = await this.measureStep('Intake', async () => {
            const response = await api.post('/damage-assessments/intakes', {
                vehicleInfo: {
                    brand: 'NISSAN',
                    model: 'PICK UP',
                    year: '2020',
                    plate: 'TEST123',
                    vinCode: 'JN1WBYD21U0113145'
                },
                description: 'Test integration damage assessment',
                images: [
                    'https://example.com/image1.jpg',
                    'https://example.com/image2.jpg'
                ]
            });

            this.assessmentId = response.data.id;
            return response.data;
        });

        console.log('Intake result:', result);
        return result;
    }

    async testGetDamages() {
        if (!this.assessmentId) throw new Error('No assessment ID available');

        const result = await this.measureStep('Get Damages', async () => {
            const response = await api.get(`/damage-assessments/${this.assessmentId}/damages`);
            return response.data;
        });

        console.log('Damages detected:', result.detectedDamages?.length || 0);
        return result;
    }

    async testConfirmDamages(damagesResponse: any) {
        if (!this.assessmentId) throw new Error('No assessment ID available');

        const detectedDamages = damagesResponse.detectedDamages || [];
        const confirmedIds = detectedDamages.slice(0, 2).map((d: any) => d._id || `${d.area}-${d.subarea}`);

        const result = await this.measureStep('Confirm Damages', async () => {
            const response = await api.patch(`/damage-assessments/${this.assessmentId}/damages/confirm`, {
                confirmedDamageIds: confirmedIds,
                edits: []
            });
            return response.data;
        });

        console.log('Confirmed damages:', confirmedIds.length);
        return result;
    }

    async testGenerateOperations() {
        if (!this.assessmentId) throw new Error('No assessment ID available');

        const result = await this.measureStep('Generate Operations', async () => {
            const response = await api.post(`/damage-assessments/${this.assessmentId}/operations/generate`);
            return response.data;
        });

        console.log('Operations generated:', result.gtMotiveMappings?.length || 0);
        return result;
    }

    async testEditOperations() {
        if (!this.assessmentId) throw new Error('No assessment ID available');

        const result = await this.measureStep('Edit Operations', async () => {
            const response = await api.patch(`/damage-assessments/${this.assessmentId}/operations`, {
                operations: [
                    {
                        partName: 'Paragolpes delantero',
                        operation: 'REPLACE',
                        notes: 'Test operation edit'
                    }
                ]
            });
            return response.data;
        });

        console.log('Operations edited successfully');
        return result;
    }

    async testGenerateValuation() {
        if (!this.assessmentId) throw new Error('No assessment ID available');

        const result = await this.measureStep('Generate Valuation', async () => {
            const response = await api.post(`/damage-assessments/${this.assessmentId}/valuation/generate`);
            return response.data;
        });

        console.log('Valuation generated:', {
            labor: result.laborOutput?.length || 0,
            paint: result.paintWorks?.length || 0,
            compact: !!result.compact
        });
        return result;
    }

    async testFinalize() {
        if (!this.assessmentId) throw new Error('No assessment ID available');

        const result = await this.measureStep('Finalize', async () => {
            const response = await api.patch(`/damage-assessments/${this.assessmentId}/finalize`);
            return response.data;
        });

        console.log('Assessment finalized successfully');
        return result;
    }

    async runCompleteTest() {
        console.log('🚀 Starting Wizard V2 Integration Test...\n');

        try {
            // 1. Intake
            await this.testIntake();

            // 2. Get damages (polling simulation)
            let damagesResult;
            let attempts = 0;
            const maxAttempts = 10;

            do {
                attempts++;
                damagesResult = await this.testGetDamages();

                if (damagesResult.workflow?.status === 'processing') {
                    console.log(`⏳ Still processing... (attempt ${attempts}/${maxAttempts})`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } while (damagesResult.workflow?.status === 'processing' && attempts < maxAttempts);

            if (damagesResult.workflow?.status === 'processing') {
                throw new Error('Timeout waiting for damage detection');
            }

            // 3. Confirm damages
            await this.testConfirmDamages(damagesResult);

            // 4. Generate operations
            await this.testGenerateOperations();

            // 5. Edit operations
            await this.testEditOperations();

            // 6. Generate valuation
            await this.testGenerateValuation();

            // 7. Finalize
            await this.testFinalize();

            this.printSummary();

        } catch (error) {
            console.error('\n❌ Test failed:', error);
            this.printSummary();
            throw error;
        }
    }

    private printSummary() {
        console.log('\n📊 Test Summary:');
        console.log('================');

        const totalSteps = this.results.length;
        const successfulSteps = this.results.filter(r => r.success).length;
        const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);

        console.log(`Total steps: ${totalSteps}`);
        console.log(`Successful: ${successfulSteps}`);
        console.log(`Failed: ${totalSteps - successfulSteps}`);
        console.log(`Total time: ${totalTime}ms`);
        console.log(`Assessment ID: ${this.assessmentId}`);

        console.log('\nStep details:');
        this.results.forEach(result => {
            const status = result.success ? '✅' : '❌';
            console.log(`${status} ${result.step}: ${result.duration}ms ${result.error ? `(${result.error})` : ''}`);
        });
    }
}

// Función principal para ejecutar desde consola
export async function testWizardV2Integration() {
    const test = new WizardV2IntegrationTest();
    await test.runCompleteTest();
}

// Auto-ejecutar si se llama directamente
if (typeof window !== 'undefined') {
    (window as any).testWizardV2Integration = testWizardV2Integration;
    console.log('💡 Test function available: testWizardV2Integration()');
}
