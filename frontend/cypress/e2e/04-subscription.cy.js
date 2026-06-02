describe('Subscription Page', () => {
  it('should navigate to a creator page', () => {
    cy.visit('/creator/test-creator');
    cy.url().should('include', '/creator/');
  });
});