export type PaymentType =
  | 'DOMESTIC'
  | 'FILE'
  | 'INTERNATIONAL'
  | 'DOMESTIC_SCHEDULED'
  | 'DOMESTIC_STANDING_ORDER'
  | 'INTERNATIONAL_SCHEDULED'
  | 'INTERNATIONAL_STANDING_ORDER';

export type PaymentScheme = 'FPS' | 'BACS' | 'CHAPS' | 'SWIFT';

export type ChargeBearer =
  | 'BorneByDebtor'
  | 'BorneByCreditor'
  | 'Shared'
  | 'FollowingServiceLevel';

export type TierRateType = 'FIXED' | 'PERCENTAGE' | 'HYBRID' | 'GREATER_OF';

export type FeeType = 'FLAT' | 'PERCENTAGE' | 'TIERED_SLAB' | 'TIERED_STEP' | 'FREE';

export interface Tier {
  min: number;
  max: number;
  rateType: TierRateType;
  amount?: number;
  percentage?: number;
}

export interface FeeRuleResponse {
  id: string;
  paymentType: PaymentType;
  scheme: PaymentScheme;
  chargeBearer: ChargeBearer;
  accountIdentification?: string;
  chargeType: string;
  feeType: FeeType;
  flatAmount?: number;
  percentage?: number;
  minFee?: number;
  maxFee?: number;
  tiers: Tier[];
  currency: string;
  destinationCountry?: string;
  priority: number;
  active: boolean;
  version: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface FeeRulePageResponse {
  content: FeeRuleResponse[];
  page: {
    number: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface CreateFeeRuleRequest {
  paymentType: PaymentType;
  scheme: PaymentScheme;
  chargeBearer: ChargeBearer;
  accountIdentification?: string;
  chargeType: string;
  feeType: FeeType;
  flatAmount?: number;
  percentage?: number;
  minFee?: number;
  maxFee?: number;
  tiers?: Tier[];
  currency: string;
  destinationCountry?: string;
  priority?: number;
}

export interface UpdateFeeRuleRequest extends CreateFeeRuleRequest {
  version: number;
}

export interface StatusToggleRequest {
  active: boolean;
  version: number;
}

export interface FeeRuleFilters {
  paymentType?: string;
  scheme?: string;
  chargeBearer?: string;
  feeType?: string;
  currency?: string;
  accountIdentification?: string;
  destinationCountry?: string;
  active?: boolean;
}

export interface AmountDto {
  amount: number;
  currency: string;
}

export interface AccountDto {
  schemeName: string;
  identification: string;
}

export interface DryRunRequest {
  rule: CreateFeeRuleRequest;
  instructedAmount?: AmountDto;
  debtorAccount?: AccountDto;
  creditorAccount?: AccountDto;
}

export interface ChargeDto {
  chargeBearer: string;
  type: string;
  amount: AmountDto;
  chargingParty: AccountDto;
}

export interface DryRunResponse {
  charges: ChargeDto[];
}
