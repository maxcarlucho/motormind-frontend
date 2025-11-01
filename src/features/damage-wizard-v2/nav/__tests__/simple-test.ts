import { STEP_ORDER, stepFromWorkflow, getStepIndex, isStepEditable } from '../steps';

// Test simple para verificar que las funciones básicas funcionan
console.log('Testing navigation system...');

// Test 1: Verificar orden de pasos
console.log('STEP_ORDER:', STEP_ORDER);
console.log('✅ STEP_ORDER length:', STEP_ORDER.length);

// Test 2: Verificar stepFromWorkflow
console.log('stepFromWorkflow("detected"):', stepFromWorkflow('detected'));
console.log('stepFromWorkflow("valuated"):', stepFromWorkflow('valuated'));

// Test 3: Verificar getStepIndex
console.log('getStepIndex("damages"):', getStepIndex('damages'));
console.log('getStepIndex("operations"):', getStepIndex('operations'));

// Test 4: Verificar isStepEditable
console.log('isStepEditable("intake", "valuated"):', isStepEditable('intake', 'valuated')); // debería ser false (solo lectura)
console.log('isStepEditable("valuation", "valuated"):', isStepEditable('valuation', 'valuated')); // debería ser true (editable)

console.log('✅ All basic functions working correctly!');

