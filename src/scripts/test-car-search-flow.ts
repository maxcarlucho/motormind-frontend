/**
 * Script de prueba para verificar el flujo de búsqueda de coches y upload de imágenes
 * Simula el flujo que ahora hace la página de Intake
 */

import { ApiService } from '@/service/api.service';

// Función principal de prueba
async function testCarSearchFlow() {
  console.log('🧪 Iniciando prueba del flujo de búsqueda de coches y upload...\n');

  try {
    const api = ApiService.getInstance();
    
    // 1. Verificar que tenemos token
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token de autenticación. Haz login primero.');
    }
    console.log('✅ Token de autenticación encontrado');

    // 2. Probar búsqueda/creación de coche por matrícula
    console.log('\n🔍 Paso 1: Buscando/creando coche por matrícula...');
    const testPlate = 'TEST123';
    
    const carResponse = await api.get('/cars/vin-or-plate', {
      params: { plate: testPlate }
    });

    const carData = carResponse.data as any;
    console.log('✅ Coche encontrado/creado:', {
      id: carData._id,
      plate: carData.plate,
      brand: carData.brand,
      model: carData.model,
      year: carData.year,
      workshopId: carData.workshopId
    });

    const carId = carData._id;

    // 3. Simular upload de imagen con carId
    console.log('\n📤 Paso 2: Simulando upload de imagen con carId...');
    
    // Crear un FormData mock para simular el upload
    console.log('Simulando upload con carId:', carId);
    console.log('✅ Upload simulado exitosamente (en implementación real se usaría useFileUpload)');

    // 4. Probar creación de damage assessment
    console.log('\n🔨 Paso 3: Simulando creación de damage assessment...');
    
    const intakePayload = {
      plate: testPlate,
      claimDescription: 'Test de integración - daño simulado',
      images: ['test-image-1.jpg', 'test-image-2.jpg'], // URLs simuladas
    };

    console.log('Payload de intake:', intakePayload);
    console.log('✅ Assessment simulado exitosamente (en implementación real se usaría startIntake)');

    console.log('\n🎉 ¡Flujo de prueba completado exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('  ✅ Búsqueda/creación de coche: OK');
    console.log('  ✅ Upload con carId: OK (simulado)');
    console.log('  ✅ Creación de assessment: OK (simulado)');

  } catch (error: any) {
    console.error('\n❌ Error en la prueba:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Auto-ejecutar si estamos en el navegador
if (typeof window !== 'undefined') {
  console.log('Para ejecutar la prueba, ejecuta: testCarSearchFlow()');
  (window as any).testCarSearchFlow = testCarSearchFlow;
}

export { testCarSearchFlow };
