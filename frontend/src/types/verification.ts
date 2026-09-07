// ============================================================
// DOVI 2.0 — Vendor Verification Types
// ============================================================

export type VerificationStatus = 'unverified' | 'partially_verified' | 'fully_verified';

export interface VendorVerification {
  vendor_id: string;
  email_verified: boolean;
  email_verified_at: string | null;
  phone_verified: boolean;
  phone_verified_at: string | null;
  phone_number: string | null;
  verification_status: VerificationStatus;
  updated_at: string;
}

export interface SendOTPRequest {
  phone_number: string;
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
  cooldown_seconds: number;
  expires_in_seconds: number;
}

export interface VerifyOTPRequest {
  phone_number: string;
  code: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  verification_status: VerificationStatus;
}

export interface SendEmailVerificationResponse {
  success: boolean;
  message: string;
}

export interface VerifyEmailTokenRequest {
  token: string;
}

export interface VerifyEmailTokenResponse {
  success: boolean;
  message: string;
  verification_status: VerificationStatus;
}
