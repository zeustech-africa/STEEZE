# STEEZE Centralized Logging Plan

**Version:** 1.0
**Last Updated:** June 2, 2026
**Owner:** ZeusTech Infrastructure Team

---

## Current Implementation

| Component | Tool | Purpose |
|-----------|------|---------|
| Application logs | Winston | Structured JSON logging |
| Error tracking | Sentry | Real-time error monitoring |
| Backend logs | Console + File | Development debugging |
| Frontend logs | Browser console | Client-side debugging |

### Current Limitations

| Issue | Impact |
|-------|--------|
| No centralized search | Cannot search across all logs |
| No log aggregation | Logs scattered across servers |
| Limited retention | No retention policy enforced |
| No alerting on logs | Manual monitoring only |

---

## Proposed Solution: BetterStack (Logtail)

### Why BetterStack?

| Factor | Assessment |
|--------|------------|
| Cost | Free tier available (1GB/month) |
| Ease of setup | 5-minute integration |
| Search capability | Full-text search, filtering |
| Alerting | Built-in alert rules |
| Retention | 30 days on free tier |

### Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **BetterStack (Logtail)** | Free tier, easy setup, good search | Limited volume on free tier |
| ELK Stack | Full control, no vendor lock-in | Requires maintenance, server costs |
| Datadog | Enterprise features | Expensive for startup |
| AWS CloudWatch | Native if on AWS | Complex setup, pay-per-log |

---

## Implementation Plan

### Phase 1: Setup (Week 1)

| Step | Action | Owner |
|------|--------|-------|
| 1 | Create BetterStack account | Infrastructure Lead |
| 2 | Get Logtail source token | Infrastructure Lead |
| 3 | Install `@logtail/node` and `@logtail/winston` | Backend Developer |
| 4 | Configure Winston transport | Backend Developer |

### Phase 2: Integration (Week 1-2)

```javascript
// Example integration
const { Logtail } = require('@logtail/node');
const { LogtailTransport } = require('@logtail/winston');

const logtail = new Logtail('YOUR_SOURCE_TOKEN');

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new LogtailTransport(logtail)
  ]
});
```

### Phase 3: Frontend Logging (Week 2)

```javascript
// Frontend logging with @logtail/browser
import { Logtail } from '@logtail/browser';

const logtail = new Logtail('YOUR_BROWSER_TOKEN');

logtail.info('User action', { userId: '123', action: 'login' });
```

### Phase 4: Alerting Configuration (Week 2)

| Alert Rule | Condition | Action |
|------------|-----------|--------|
| High error rate | >10 errors/minute | Slack + Email |
| Critical errors | Error level = 'critical' | PagerDuty + SMS |
| Auth failures | >5 failures/minute | Slack alert |

### Phase 5: Dashboard (Week 3)

| Dashboard | Purpose |
|-----------|---------|
| Error overview | Error rates by service |
| Auth monitoring | Login success/failure trends |
| API performance | Response time distribution |
| User activity | Request volume by endpoint |

---

## Deployment Timeline

| Milestone | Date | Status |
|-----------|------|--------|
| BetterStack account created | Within 7 days | ⏳ Pending |
| Backend Winston integration | Within 14 days | ⏳ Pending |
| Frontend browser logging | Within 14 days | ⏳ Pending |
| Alerting configured | Within 21 days | ⏳ Pending |
| Dashboards created | Within 30 days | ⏳ Pending |

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Log ingestion latency | < 5 seconds |
| Search response time | < 2 seconds |
| Log retention | 30 days |
| Alert response time | < 5 minutes |

---

## Budget

| Item | Cost |
|------|------|
| BetterStack free tier | R0 |
| BetterStack paid tier (if needed) | $0.50/GB |
| Estimated monthly cost (launch) | R0 - R100 |

---

## Rollback Plan

If BetterStack proves insufficient:

| Step | Action |
|------|--------|
| 1 | Remove Logtail transport from Winston |
| 2 | Switch to ELK Stack self-hosted |
| 3 | Update deployment configuration |
| 4 | Migrate existing logs (if needed) |

---

## Owner

| Role | Responsibility |
|------|----------------|
| Infrastructure Lead | Implementation owner |
| Backend Developer | Integration |
| DevOps Engineer | Monitoring and alerting |

---

## Appendix: Sample Log Entry

```json
{
  "timestamp": "2026-06-02T10:00:00.000Z",
  "level": "info",
  "message": "User login successful",
  "service": "auth",
  "userId": "user_123",
  "ip": "192.168.1.1",
  "environment": "production"
}
```

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-06-02 | ZeusTech | Initial plan |