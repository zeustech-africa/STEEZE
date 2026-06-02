describe('Wallet Page', () => {
  it('should navigate to wallet page', () => {
    cy.visit('/creator/test-creator/wallet');
    cy.url().should('include', '/wallet');
  });
});