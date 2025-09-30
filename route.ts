import { NextRequest, NextResponse } from 'next/server';
import { createVerificationRequest, getVerificationRequestsByValue, updateVerificationRequest } from '@/lib/database';
import { abstractAPI } from '@/lib/abstract-api';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const { phone } = await request.json();
    
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Valid phone number is required' },
        { status: 400 }
      );
    }

    // Basic phone number validation (accepts various formats)
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Check for recent verification attempts (rate limiting)
    const recentAttempts = await getVerificationRequestsByValue('phone', phone);
    const recentAttempt = recentAttempts.find(
      attempt => 
        new Date(attempt.created_at!).getTime() > Date.now() - 5 * 60 * 1000 // 5 minutes
    );

    if (recentAttempt) {
      return NextResponse.json(
        { error: 'Please wait before requesting another verification' },
        { status: 429 }
      );
    }

    // Validate phone using Abstract API
    let validationData;

    try {
      validationData = await abstractAPI.validatePhone(phone);
    } catch (apiError) {
      console.error('Abstract API error:', apiError);
      return NextResponse.json(
        { error: 'Failed to validate phone with external service' },
        { status: 502 }
      );
    }

    // Calculate risk level and quality score for phone
    let qualityScore = 0.8; // Default good score
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    
    // Adjust quality score based on phone type and validity
    if (!validationData.valid) {
      qualityScore = 0.1;
      riskLevel = 'high';
    } else if (validationData.type === 'Mobile') {
      qualityScore = 0.9;
    } else if (validationData.type === 'Landline') {
      qualityScore = 0.7;
    } else if (validationData.type === 'Toll_Free' || validationData.type === 'Unknown') {
      qualityScore = 0.5;
      riskLevel = 'medium';
    }

    // Create verification request
    const verificationRequest = await createVerificationRequest({
      type: 'phone',
      value: phone,
      status: validationData.valid ? 'verified' : 'failed',
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      validation_data: validationData,
      api_response_time: 0, // Will be calculated below
      quality_score: qualityScore,
      risk_level: riskLevel
    });

    // In a real implementation, you would send an SMS here
    // For demo purposes, we'll just return the verification code
    console.log(`Phone verification code for ${phone}: ${verificationRequest.verification_code}`);

    // Update the verification request with actual API response time
    const endTime = Date.now();
    const responseTime = endTime - startTime; // startTime will be defined below
    
    await updateVerificationRequest(verificationRequest.id!, {
      api_response_time: responseTime
    });

    return NextResponse.json({
      success: true,
      message: 'Phone validation completed successfully',
      requestId: verificationRequest.id,
      // In production, remove this code from response and send via SMS
      verificationCode: verificationRequest.verification_code,
      validation: validationData,
      qualityScore: qualityScore,
      riskLevel: riskLevel,
      responseTime: responseTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Phone verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
