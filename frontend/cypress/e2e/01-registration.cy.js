describe('Viber Registration Flow', () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testUsername = `testuser_${Date.now()}`;

  it('should complete registration via API', () => {
    // Use API registration to bypass complex UI
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/auth/register',
      body: {
        email: testEmail,
        password: testPassword,
        username: testUsername,
        fullName: 'E2E Test User',
        cfTurnstileResponse: 'test-bypass'
      }
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('user');
      
      // Store cookies for subsequent tests
      const cookies = response.headers['set-cookie'];
      if (cookies && cookies.length) {
        cy.setCookie('accessToken', cookies[0].split(';')[0].split('=')[1]);
      }
    });
  });
});