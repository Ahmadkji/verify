// Abstract API Configuration and Utilities

export interface AbstractEmailValidationResult {
  email_address: string;
  email_deliverability: {
    status: 'deliverable' | 'undeliverable' | 'unknown';
    status_detail: string;
    is_format_valid: boolean;
    is_smtp_valid: boolean;
    is_mx_valid: boolean;
    mx_records: string[];
  };
  email_quality: {
    score: number;
    is_free_email: boolean;
    is_username_suspicious: boolean;
    is_disposable: boolean;
    is_catchall: boolean;
    is_subaddress: boolean;
    is_role: boolean;
    is_dmarc_enforced: boolean;
    is_spf_strict: boolean;
    minimum_age: number | null;
  };
  email_sender: {
    first_name: string | null;
    last_name: string | null;
    email_provider_name: string | null;
    organization_name: string | null;
    organization_type: string | null;
  };
  email_domain: {
    domain: string;
    domain_age: number;
    is_live_site: boolean;
    registrar: string | null;
    registrar_url: string | null;
    date_registered: string;
    date_last_renewed: string;
    date_expires: string;
    is_risky_tld: boolean;
  };
  email_risk: {
    address_risk_status: 'low' | 'medium' | 'high';
    domain_risk_status: 'low' | 'medium' | 'high';
  };
  email_breaches: {
    total_breaches: number;
    date_first_breached: string | null;
    date_last_breached: string | null;
    breached_domains: Array<{
      domain: string;
      date_breached: string;
    }>;
  };
}

export interface AbstractEmailReputationResult {
  email_address: string;
  email_deliverability: {
    status: 'deliverable' | 'undeliverable' | 'unknown';
    status_detail: string;
    is_format_valid: boolean;
    is_smtp_valid: boolean;
    is_mx_valid: boolean;
    mx_records: string[];
  };
  email_quality: {
    score: number;
    is_free_email: boolean;
    is_username_suspicious: boolean;
    is_disposable: boolean;
    is_catchall: boolean;
    is_subaddress: boolean;
    is_role: boolean;
    is_dmarc_enforced: boolean;
    is_spf_strict: boolean;
    minimum_age: number | null;
  };
  email_sender: {
    first_name: string | null;
    last_name: string | null;
    email_provider_name: string | null;
    organization_name: string | null;
    organization_type: string | null;
  };
  email_domain: {
    domain: string;
    domain_age: number;
    is_live_site: boolean;
    registrar: string | null;
    registrar_url: string | null;
    date_registered: string;
    date_last_renewed: string;
    date_expires: string;
    is_risky_tld: boolean;
  };
  email_risk: {
    address_risk_status: 'low' | 'medium' | 'high';
    domain_risk_status: 'low' | 'medium' | 'high';
  };
  email_breaches: {
    total_breaches: number;
    date_first_breached: string | null;
    date_last_breached: string | null;
    breached_domains: Array<{
      domain: string;
      date_breached: string;
    }>;
  };
}

export interface AbstractPhoneValidationResult {
  phone: string;
  valid: boolean;
  format: {
    international: string;
    local: string;
  };
  country: {
    code: string;
    name: string;
    prefix: string;
  };
  location: string;
  type: 'Landline' | 'Mobile' | 'Satellite' | 'Premium' | 'Paging' | 'Special' | 'Toll_Free' | 'Unknown';
  carrier: string;
}

class AbstractAPIClient {
  private emailApiKey: string;
  private phoneApiKey: string;

  constructor() {
    this.emailApiKey = process.env.ABSTRACT_EMAIL_API_KEY || '';
    this.phoneApiKey = process.env.ABSTRACT_PHONE_API_KEY || '';

    if (!this.emailApiKey || !this.phoneApiKey) {
      console.warn('Abstract API keys not found in environment variables');
    }
  }

  async validateEmail(email: string): Promise<AbstractEmailValidationResult> {
    const maxRetries = 3;
    const timeout = 10000; // 10 seconds timeout
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (!this.emailApiKey) {
          throw new Error('Email API key not configured');
        }

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(
          `https://emailreputation.abstractapi.com/v1/?api_key=${this.emailApiKey}&email=${encodeURIComponent(email)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Verification-SaaS/1.0'
            },
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Abstract API HTTP error:', response.status, errorText);
          
          // Don't retry on client errors (4xx) except for rate limiting
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
          }
          
          // Retry on server errors (5xx) and rate limiting
          if (attempt === maxRetries) {
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
          }
          
          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        const data = await response.json();
        
        // Validate response structure
        if (!data.email_address || !data.email_deliverability) {
          console.error('Invalid API response structure:', data);
          if (attempt === maxRetries) {
            throw new Error('Invalid API response structure');
          }
          continue;
        }
        
        return data;
      } catch (error) {
        console.error(`Email validation attempt ${attempt} failed:`, error);
        
        // Check if it's a network error or timeout
        if (error instanceof Error) {
          if (error.name === 'AbortError' || error.name === 'TypeError' || error.message.includes('fetch')) {
            // Network error or timeout - retry
            if (attempt === maxRetries) {
              throw new Error('Failed to connect to email validation service. Please check your internet connection.');
            }
            
            // Wait before retrying
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          // Re-throw non-retryable errors immediately
          if (attempt === 1) {
            throw new Error(`Failed to validate email with Abstract API: ${error.message}`);
          }
        }
        
        if (attempt === maxRetries) {
          if (error instanceof Error) {
            throw new Error(`Failed to validate email with Abstract API: ${error.message}`);
          }
          throw new Error('Failed to validate email with Abstract API');
        }
        
        // Wait before retrying
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Failed to validate email with Abstract API');
  }

  async getEmailReputation(email: string): Promise<AbstractEmailReputationResult> {
    const maxRetries = 3;
    const timeout = 10000; // 10 seconds timeout
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(
          `https://emailreputation.abstractapi.com/v1/?api_key=${this.emailApiKey}&email=${encodeURIComponent(email)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Verification-SaaS/1.0'
            },
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (attempt === maxRetries) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error(`Email reputation attempt ${attempt} failed:`, error);
        
        if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TypeError')) {
          if (attempt === maxRetries) {
            throw new Error('Failed to connect to email reputation service. Please check your internet connection.');
          }
          
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        if (attempt === maxRetries) {
          throw new Error('Failed to get email reputation from Abstract API');
        }
        
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Failed to get email reputation from Abstract API');
  }

  async validatePhone(phone: string): Promise<AbstractPhoneValidationResult> {
    const maxRetries = 3;
    const timeout = 10000; // 10 seconds timeout
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(
          `https://phonevalidation.abstractapi.com/v1/?api_key=${this.phoneApiKey}&phone=${encodeURIComponent(phone)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Verification-SaaS/1.0'
            },
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (attempt === maxRetries) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error(`Phone validation attempt ${attempt} failed:`, error);
        
        if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TypeError')) {
          if (attempt === maxRetries) {
            throw new Error('Failed to connect to phone validation service. Please check your internet connection.');
          }
          
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        if (attempt === maxRetries) {
          throw new Error('Failed to validate phone with Abstract API');
        }
        
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Failed to validate phone with Abstract API');
  }

  async validateEmailWithReputation(email: string): Promise<{
    validation: AbstractEmailValidationResult;
    reputation: AbstractEmailReputationResult;
  }> {
    try {
      // Since validateEmail now returns the full reputation data,
      // we can use it directly and avoid making duplicate API calls
      const validation = await this.validateEmail(email);
      
      return { 
        validation, 
        reputation: validation 
      };
    } catch (error) {
      console.error('Combined email validation error:', error);
      throw new Error('Failed to validate email with reputation data');
    }
  }
}

// Export singleton instance
export const abstractAPI = new AbstractAPIClient();
