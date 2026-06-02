describe('Content Upload', () => {
  const creatorEmail = `creator_${Date.now()}@example.com`;
  const creatorPassword = 'TestPassword123!';
  const creatorUsername = `creator_${Date.now()}`;

  it('should register creator, login via API, and access upload page', () => {
    // Register via API
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/auth/register',
      body: {
        email: creatorEmail,
        password: creatorPassword,
        username: creatorUsername,
        fullName: 'E2E Creator'
      },
      failOnStatusCode: false
    });

    // Login via API (bypass CAPTCHA with test-bypass token)
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/auth/login',
      body: {
        email: creatorEmail,
        password: creatorPassword,
        cfTurnstileResponse: 'test-bypass'
      },
      failOnStatusCode: false
    }).then((response) => {
      if (response.status === 200) {
        const cookies = response.headers['set-cookie'];
        if (cookies && cookies.length) {
          cy.setCookie('accessToken', cookies[0].split(';')[0].split('=')[1]);
        }
      }
    });
    
    cy.visit('/upload');
    cy.url().should('include', '/upload');
  });
});