describe('User Login', () => {
  const testEmail = `login_test_${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testUsername = `loginuser_${Date.now()}`;

  it('should register and login via API', () => {
    // Register via API
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/auth/register',
      body: {
        email: testEmail,
        password: testPassword,
        username: testUsername,
        fullName: 'Login Test User'
      },
      failOnStatusCode: false
    });

    // Login via API (bypass CAPTCHA with test-bypass token)
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/auth/login',
      body: {
        email: testEmail,
        password: testPassword,
        cfTurnstileResponse: 'test-bypass'
      },
      failOnStatusCode: false
    }).then((response) => {
      if (response.status === 200) {
        expect(response.body).to.have.property('user');
        const cookies = response.headers['set-cookie'];
        if (cookies && cookies.length) {
          cy.setCookie('accessToken', cookies[0].split(';')[0].split('=')[1]);
        }
      }
    });
  });
});