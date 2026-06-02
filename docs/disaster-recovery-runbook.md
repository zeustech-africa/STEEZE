# STEEZE Disaster Recovery Runbook

**Version:** 1.0
**Last Updated:** June 2, 2026
**Owner:** ZeusTech Infrastructure Team

---

## SECTION A: Database Failure Procedure

### Detection
| Signal | Method |
|--------|--------|
| Prisma connection error | Backend logs / Sentry alert |
| Query timeout (>5s) | Performance monitoring |
| Replica lag > 10 seconds | Database monitoring |

### Alert Recipients
| Role | Contact Method |
|------|----------------|
| Infrastructure Lead | SMS + Email + Slack |
| Technical Lead | Email + Slack |
| Business Owner | Email |

### Restoration Process
| Step | Action | Estimated Time |
|------|--------|----------------|
| 1 | Assess failure cause (connection/corruption/outage) | 5 min |
| 2 | If primary down, promote read replica to primary | 10 min |
| 3 | Update DATABASE_URL environment variable | 5 min |
| 4 | Restart backend services | 5 min |
| 5 | Verify connectivity with test query | 5 min |

### Recovery Time Objective (RTO): 30 minutes
### Recovery Point Objective (RPO): 24 hours (daily backups)

### Validation Procedure
```sql
-- Run after restoration
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Post";
SELECT NOW();
```

---

## SECTION B: Media Storage Failure (Cloudflare R2)

### Detection

| Signal | Method |
|--------|--------|
| 4xx/5xx errors on upload endpoints | API logs |
| Image loading failures | Frontend error tracking |
| R2 health check failure | Cron job (every 60 seconds) |

### Fallback Process

| Step | Action | Time |
|------|--------|------|
| 1 | Detect R2 outage | Immediate |
| 2 | Switch to local temporary storage | 2 min |
| 3 | Queue uploads for retry | Automatic |
| 4 | Notify users of degraded service | 5 min |

### Recovery Process

| Step | Action |
|------|--------|
| 1 | Verify R2 service health |
| 2 | Sync queued uploads to R2 |
| 3 | Verify file integrity |
| 4 | Resume normal operations |

### Data Verification

- Compare file hashes before/after
- Verify file sizes match
- Spot-check random files

---

## SECTION C: Authentication Failure Procedure

### Detection

| Signal | Method |
|--------|--------|
| Login timeout > 5 seconds | API monitoring |
| JWT verification errors | Backend logs |
| Rate limit hit rate > 50% | Rate limit metrics |

### Impact Assessment

| System | Impact |
|--------|--------|
| User login | ❌ Unavailable |
| New registrations | ❌ Unavailable |
| Authenticated API calls | ❌ Unavailable |
| Public content viewing | ✅ Available |

### Recovery Steps

| Step | Action |
|------|--------|
| 1 | Check JWT_SECRET environment variable |
| 2 | Verify refresh token service |
| 3 | Restart auth service |
| 4 | Clear failed attempt cache |
| 5 | Verify login functionality |

### Verification

- Test login with known credentials
- Test token refresh
- Test logout

---

## SECTION D: Payment Failure (Paystack Outage)

### Detection

| Signal | Method |
|--------|--------|
| Paystack API timeout | Payment service logs |
| Webhook delivery failures | Webhook monitoring |
| User reports | Customer support |

### Protection of Transactions

| Measure | Implementation |
|---------|---------------|
| Idempotency keys | Prevent duplicate processing |
| Webhook retries | Automatic with exponential backoff |
| Transaction logging | All attempts recorded |

### Reconciliation Process

| Step | Action |
|------|--------|
| 1 | Export failed transaction logs |
| 2 | Query Paystack for missing transactions |
| 3 | Manually reconcile discrepancies |
| 4 | Credit/refund affected users |

### Recovery Process

| Step | Action |
|------|--------|
| 1 | Verify Paystack service restored |
| 2 | Replay failed webhooks |
| 3 | Update transaction statuses |
| 4 | Notify affected users |

---

## SECTION E: Security Incident Procedure

### Incident Types

| Type | Example |
|------|---------|
| Account compromise | Unauthorized login detected |
| Data leak | Exposed API keys |
| Unauthorized access | Admin privilege misuse |

### Response Process

| Phase | Actions | Time |
|-------|---------|------|
| Detection | Alert from security monitoring | Immediate |
| Containment | Revoke compromised tokens, disable affected accounts | 15 min |
| Investigation | Review audit logs, identify scope | 60 min |
| Remediation | Apply fixes, rotate secrets | 120 min |
| Recovery | Restore affected data, notify users | 240 min |

### Escalation Contacts

| Role | Contact |
|------|---------|
| Security Lead | security@steeze.com |
| Technical Lead | tech@steeze.com |
| Business Owner | ceo@zeustechafrica.com |

---

## SECTION F: Escalation Contacts

### Primary Contacts

| Role | Name | Contact | Backup |
|------|------|---------|--------|
| Technical Lead | [TBD] | [TBD] | Infrastructure Lead |
| Infrastructure Lead | [TBD] | [TBD] | Technical Lead |
| Security Lead | [TBD] | [TBD] | Technical Lead |
| Business Owner | [Name] | ceo@zeustechafrica.com | COO |

### External Vendors

| Vendor | Contact Method | Escalation |
|--------|---------------|------------|
| Paystack | support@paystack.com | Account manager |
| Cloudflare | Enterprise support portal | Technical account manager |
| Render (hosting) | Support dashboard | Premium support |

### Communication Plan

| Audience | Method | Time |
|----------|--------|------|
| Internal team | Slack #incident | Immediate |
| Users | Status page / email | Within 1 hour |
| Stakeholders | Direct call | Within 30 minutes |

---

## Appendix: Recovery Scripts

### Database Backup Restore

```bash
# Restore from latest backup
pg_restore --verbose --clean --no-acl --no-owner -d steeze latest_backup.dump
```

### Verify Database Integrity

```bash
# Check for corrupted tables
psql -d steeze -c "CHECKPOINT;"
```

### R2 Health Check

```bash
aws s3api head-bucket --bucket steeze-uploads --endpoint-url https://<account-id>.r2.cloudflarestorage.com
```

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-06-02 | ZeusTech | Initial runbook |