// Custom login command using cy.session() (Cypress 12+)
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('#email').type(email);
    cy.get('#password').type(password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/feed');
  });
});

// Register command
Cypress.Commands.add('register', (userData) => {
  cy.request('POST', 'http://localhost:5000/api/auth/register', userData);
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.request('POST', 'http://localhost:5000/api/auth/logout');
});

// Visit creator profile
Cypress.Commands.add('visitCreator', (username) => {
  cy.visit(`/creator/${username}`);
});