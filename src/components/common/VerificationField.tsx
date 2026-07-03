import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Check,
  Loader2,
  Pencil,
  RotateCcw,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";

interface VerificationFieldProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  prefix?: string;
  verified: boolean;
  verifiedLabel: string;
  unverifiedLabel: string;
  otpLogId: string | null;
  otpValue: string;
  onOtpChange: (value: string) => void;
  onSendOtp: () => void;
  onVerifyOtp: () => void;
  onResetFlow: () => void;
  sendingOtp: boolean;
  verifyingOtp: boolean;
  sendButtonLabel: string;
  resendButtonLabel: string;
  otpPlaceholder?: string;
  isValueValid: boolean;
}

const VerificationField: React.FC<VerificationFieldProps> = ({
  label,
  required,
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
  inputMode,
  prefix,
  verified,
  verifiedLabel,
  unverifiedLabel,
  otpLogId,
  otpValue,
  onOtpChange,
  onSendOtp,
  onVerifyOtp,
  onResetFlow,
  sendingOtp,
  verifyingOtp,
  sendButtonLabel,
  resendButtonLabel,
  otpPlaceholder = "Enter OTP",
  isValueValid,
}) => {
  const otpPending = Boolean(otpLogId) && !verified;
  const showEdit = verified || otpPending;
  const showSendOtp = !verified && !otpPending;
  const disableInput = verified || otpPending;

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>

      <div className="rounded-lg border border-border bg-muted/20 p-3">
        {/* Main Row */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
          {/* Input */}
          <div className="flex-1">
            {prefix ? (
              <div className="flex h-9 overflow-hidden rounded-md border border-input bg-background">
                <div className="flex items-center border-r border-input bg-muted px-3 text-sm font-medium text-muted-foreground">
                  {prefix}
                </div>

                <Input
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  type={type}
                  maxLength={maxLength}
                  inputMode={inputMode}
                  disabled={disableInput}
                  className="h-full border-0 shadow-none focus-visible:ring-0"
                />
              </div>
            ) : (
              <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                type={type}
                maxLength={maxLength}
                inputMode={inputMode}
                disabled={disableInput}
                className="h-9"
              />
            )}
          </div>

          {/* Status + Send OTP */}
          <div className="flex flex-row items-center gap-2 lg:flex-row lg:items-end">
            {showEdit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9"
                onClick={onResetFlow}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}{" "}
            
            {showSendOtp && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={onSendOtp}
                disabled={sendingOtp || !isValueValid}
              >
                {sendingOtp && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}

                {sendButtonLabel}
              </Button>
            )}<span
              className={`inline-flex h-9 items-center gap-1 rounded-md px-3 text-xs font-medium whitespace-nowrap ${
                verified
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {verified ? (
                <ShieldCheck className="h-4 w-4" />
              ) : (
                <ShieldOff className="h-4 w-4" />
              )}

              {verified ? verifiedLabel : unverifiedLabel}
            </span>
          </div>
        </div>

        {/* OTP Section */}
        {otpPending && (
          <div className="mt-4 border-t pt-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <Input
                value={otpValue}
                onChange={(e) =>
                  onOtpChange(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder={otpPlaceholder}
                className="h-9 lg:w-44"
                inputMode="numeric"
                maxLength={6}
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="h-9"
                  onClick={onVerifyOtp}
                  disabled={verifyingOtp || otpValue.length !== 6}
                >
                  {verifyingOtp ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Verify
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-9"
                  onClick={onSendOtp}
                  disabled={sendingOtp}
                >
                  {sendingOtp ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="mr-2 h-4 w-4" />
                  )}
                  {resendButtonLabel}
                </Button>

               
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationField;
