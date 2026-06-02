import './commands';

// Silence React performance.measure and other benign errors
Cypress.on('uncaught:exception', (err) => {
  const ignoredErrors = [
    'performance.measure',
    'measure',
    'ResizeObserver',
    'ResizeObserver loop'
  ];
  
  if (ignoredErrors.some(msg => err.message.includes(msg))) {
    return false;
  }
  return true;
});

// Note: Cypress.Cookies.defaults() was removed in Cypress 12.
// Use cy.session() for authentication state management instead.import 'cypress-file-upload';
