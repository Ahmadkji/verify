# Email Verification Data - Abstract API Complete Reference

This document provides a comprehensive overview of all email verification data available from the Abstract API Email Reputation service and how it's implemented in your verification system.

## Complete API Response Structure

### 1. Basic Email Information
```typescript
email_address: string
```
- **Description**: The email address being validated
- **Current Usage**: Used as the primary identifier for verification requests

### 2. Email Deliverability (`email_deliverability`)
```typescript
{
  status: 'deliverable' | 'undeliverable' | 'unknown';
  status_detail: string;
  is_format_valid: boolean;
  is_smtp_valid: boolean;
  is_mx_valid: boolean;
  mx_records: string[];
}
```

**Detailed Fields:**
- `status`: Overall deliverability status
  - `deliverable`: Email can receive messages
  - `undeliverable`: Email cannot receive messages
  - `unknown`: Status could not be determined

- `status_detail`: Specific reasons for status
  - For `deliverable`: `valid_email`, `high_traffic_email`
  - For `undeliverable`: `invalid_mailbox`, `full_mailbox`, `invalid_format`, `dns_record_not_found`, `unavailable_server`

- `is_format_valid`: Boolean - Email follows correct format
- `is_smtp_valid`: Boolean - SMTP server check passed
- `is_mx_valid`: Boolean - Domain has valid MX records
- `mx_records`: Array - List of mail exchange servers

**Current Usage**: 
- Used to determine verification status (`deliverable` = 'verified', others = 'failed')
- MX records stored for additional validation context

### 3. Email Quality (`email_quality`)
```typescript
{
  score: number; // 0.01-0.99
  is_free_email: boolean;
  is_username_suspicious: boolean;
  is_disposable: boolean;
  is_catchall: boolean;
  is_subaddress: boolean;
  is_role: boolean;
  is_dmarc_enforced: boolean;
  is_spf_strict: boolean;
  minimum_age: number | null;
}
```

**Detailed Fields:**
- `score`: Confidence score representing email quality (higher = better)
- `is_free_email`: From free providers (Gmail, Yahoo, etc.)
- `is_username_suspicious`: Appears auto-generated or suspicious
- `is_disposable`: From temporary email services
- `is_catchall`: Domain accepts all emails regardless of username
- `is_subaddress`: Uses email subaddressing (user+label@domain.com)
- `is_role`: Role-based address (info@, support@, etc.)
- `is_dmarc_enforced`: Domain has strict DMARC policy
- `is_spf_strict`: Domain enforces strict SPF policy
- `minimum_age`: Estimated age of email address in days

**Current Usage**:
- `score` used as primary quality metric for risk assessment
- Other factors contribute to overall risk level calculation

### 4. Email Sender Information (`email_sender`)
```typescript
{
  first_name: string | null;
  last_name: string | null;
  email_provider_name: string | null;
  organization_name: string | null;
  organization_type: string | null;
}
```

**Detailed Fields:**
- `first_name`: Extracted first name from email
- `last_name`: Extracted last name from email
- `email_provider_name`: Provider (Google, Microsoft, etc.)
- `organization_name`: Associated organization
- `organization_type`: Type (company, educational, etc.)

**Current Usage**: Stored in validation data for user profiling and analytics

### 5. Domain Information (`email_domain`)
```typescript
{
  domain: string;
  domain_age: number;
  is_live_site: boolean;
  registrar: string | null;
  registrar_url: string | null;
  date_registered: string;
  date_last_renewed: string;
  date_expires: string;
  is_risky_tld: boolean;
}
```

**Detailed Fields:**
- `domain`: Domain part of the email address
- `domain_age`: Age of domain in days
- `is_live_site`: Domain has active website
- `registrar`: Domain registrar name
- `registrar_url`: Registrar website URL
- `date_registered`: When domain was registered
- `date_last_renewed`: Last renewal date
- `date_expires`: Expiration date
- `is_risky_tld`: Uses risky top-level domain

**Current Usage**: Domain reputation and risk assessment factors

### 6. Risk Assessment (`email_risk`)
```typescript
{
  address_risk_status: 'low' | 'medium' | 'high';
  domain_risk_status: 'low' | 'medium' | 'high';
}
```

**Detailed Fields:**
- `address_risk_status`: Risk level of the specific email address
- `domain_risk_status`: Risk level of the domain

**Current Usage**: 
- Directly influences overall risk level calculation
- High risk status triggers elevated risk assessment

### 7. Breach Information (`email_breaches`)
```typescript
{
  total_breaches: number;
  date_first_breached: string | null;
  date_last_breached: string | null;
  breached_domains: Array<{
    domain: string;
    date_breached: string;
  }>;
}
```

**Detailed Fields:**
- `total_breaches`: Number of data breaches involving this email
- `date_first_breached`: Date of first known breach
- `date_last_breached`: Date of most recent breach
- `breached_domains`: List of affected domains and breach dates

**Current Usage**: 
- `total_breaches > 0` increases risk level
- Used for security and fraud assessment

## Current Implementation Features

### Risk Assessment Algorithm
Your system calculates risk levels using:
1. **Quality Score** (primary factor)
   - `< 0.3` = High risk
   - `0.3 - 0.7` = Medium risk
   - `> 0.7` = Low risk

2. **Risk Status Override**
   - High address/domain risk status elevates to high risk
   - Medium risk status elevates from low to medium risk

3. **Breach History Impact**
   - Any breaches increase risk level by one tier

### Data Storage
All verification data is stored in the database including:
- Complete validation response
- Reputation data (when requested)
- Calculated quality scores
- Risk assessment results
- API response times

### Error Handling
Comprehensive error handling for:
- API key configuration issues
- Rate limiting (429 status)
- Invalid API responses
- Network failures
- Service unavailability

## Potential Enhancements

### 1. Advanced Risk Scoring
```typescript
// Example enhanced risk calculation
const calculateEnhancedRisk = (data: AbstractEmailValidationResult) => {
  let riskScore = data.email_quality.score * 100;
  
  // Deduct for risk factors
  if (data.email_risk.address_risk_status === 'high') riskScore -= 30;
  if (data.email_risk.domain_risk_status === 'high') riskScore -= 20;
  if (data.email_breaches.total_breaches > 0) riskScore -= 25;
  if (data.email_quality.is_disposable) riskScore -= 40;
  if (data.email_quality.is_username_suspicious) riskScore -= 35;
  
  // Add for positive factors
  if (data.email_quality.is_dmarc_enforced) riskScore += 10;
  if (data.email_quality.is_spf_strict) riskScore += 10;
  if (data.email_quality.minimum_age > 365) riskScore += 15;
  
  return Math.max(0, Math.min(100, riskScore));
};
```

### 2. Detailed Reporting
Provide users with comprehensive breakdowns:
- Deliverability analysis
- Quality assessment details
- Security policy compliance
- Breach history summary
- Domain reputation information

### 3. Custom Validation Rules
Allow users to configure:
- Minimum quality score thresholds
- Risk tolerance levels
- Blocked email providers
- Required security policies

### 4. Reputation Tracking
Monitor email quality over time:
- Historical validation results
- Trend analysis
- Reputation scoring changes

## API Response Example

```json
{
  "email_address": "benjamin.richard@abstractapi.com",
  "email_deliverability": {
    "status": "deliverable",
    "status_detail": "valid_email",
    "is_format_valid": true,
    "is_smtp_valid": true,
    "is_mx_valid": true,
    "mx_records": ["gmail-smtp-in.l.google.com", "alt1.gmail-smtp-in.l.google.com"]
  },
  "email_quality": {
    "score": 0.8,
    "is_free_email": false,
    "is_username_suspicious": false,
    "is_disposable": false,
    "is_catchall": true,
    "is_subaddress": false,
    "is_role": false,
    "is_dmarc_enforced": true,
    "is_spf_strict": true,
    "minimum_age": 1418
  },
  "email_sender": {
    "first_name": "Benjamin",
    "last_name": "Richard",
    "email_provider_name": "Google",
    "organization_name": "Abstract API",
    "organization_type": "company"
  },
  "email_domain": {
    "domain": "abstractapi.com",
    "domain_age": 1418,
    "is_live_site": true,
    "registrar": "NAMECHEAP INC",
    "registrar_url": "http://www.namecheap.com",
    "date_registered": "2020-05-13",
    "date_last_renewed": "2024-04-13",
    "date_expires": "2025-05-13",
    "is_risky_tld": false
  },
  "email_risk": {
    "address_risk_status": "low",
    "domain_risk_status": "low"
  },
  "email_breaches": {
    "total_breaches": 2,
    "date_first_breached": "2018-07-23T14:30:00Z",
    "date_last_breached": "2019-05-24T14:30:00Z",
    "breached_domains": [
      {"domain": "apollo.io", "date_breached": "2018-07-23T14:30:00Z"},
      {"domain": "canva.com", "date_breached": "2019-05-24T14:30:00Z"}
    ]
  }
}
```

## Summary

Your verification system currently leverages the full power of the Abstract API Email Reputation service, capturing comprehensive data for:
- **Deliverability validation**
- **Quality assessment**
- **Security policy verification**
- **Risk analysis**
- **Breach detection**
- **Domain reputation**

The implementation provides a robust foundation for email verification with extensive data available for advanced features and analytics.
