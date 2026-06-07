import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp up to 50 users
    { duration: '1m', target: 100 },   // Ramp up to 100 users
    { duration: '2m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    http_req_failed: ['rate<0.001'],   // Less than 0.1% error rate
  },
};

export default function () {
  // Test a real creator profile (replace with an actual creator username)
  const creatorUsernames = [
    'kenzo',
    'test-creator-1',
    'test-creator-2',
  ];
  
  const username = creatorUsernames[Math.floor(Math.random() * creatorUsernames.length)];
  
  const response = http.get(`http://localhost:3000/creator/${username}`);
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'page loads fast': (r) => r.timings.duration < 500,
  });
  
  // Simulate user thinking time
  sleep(1);
}
