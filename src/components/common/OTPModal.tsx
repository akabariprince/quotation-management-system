// src/components/common/OTPModal.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  X,
  KeyRound,
  AlertCircle,
  CheckCircle,
  Loader2,
  Send,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string, otpLogId: string) => void;
  title: string;
  description: string;
  type: "discount" | "master_activation";
  entityId?: string;
  entityType?: string;
  entityName?: string;
}

const OTPModal: React.FC<OTPModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  title,
  description,
  type,
  entityId,
  entityType,
  entityName,
}) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpLogId, setOtpLogId] = useState<string | null>(null);
  const [sentToEmail, setSentToEmail] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { user } = useAuth();
  const api = useApi();

  // ─── Reset on open/close ──────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      setOtp(["", "", "", "", "", ""]);
      setError("");
      setSuccess(false);
      setOtpSent(false);
      setSending(false);
      setVerifying(false);
      setResendCooldown(0);
      setOtpLogId(null);
      setSentToEmail("");
    }
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, [isOpen]);

  // Focus first input when OTP sent
  useEffect(() => {
    if (otpSent && !success) {
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    }
  }, [otpSent, success]);

  // ─── Cooldown Timer ───────────────────────────────────────────────────

  const startCooldown = () => {
    setResendCooldown(60);
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ─── Send OTP (calls /auth/otp/request) ───────────────────────────────
  const handleSendOTP = async () => {
    setSending(true);
    setError("");
    try {
      const res = await api.post("/auth/otp/request", {
        email: user?.email || "",
        type,
        entityId: entityId || undefined,
        entityType: entityType || undefined,
        entityName: entityName || undefined,
        requestedBy: user?.id || undefined,
      });

      if (res.success) {
        setOtpSent(true);
        setOtpLogId(res.data?.otpLogId || null);
        setSentToEmail(
          res.data?.email ||
          user?.email?.replace(/(.{2})(.*)(@.*)/, "$1***$3") ||
          "admin",
        );
        startCooldown();
      } else {
        setError(res.message || "Failed to send OTP");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // ─── Resend OTP ───────────────────────────────────────────────────────

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    setSending(true);
    setError("");
    setOtp(["", "", "", "", "", ""]);

    try {
      if (otpLogId) {
        // Use admin resend endpoint for existing log
        const res = await api.post(`/otp-logs/${otpLogId}/resend`, {});
        if (res?.success) {
          startCooldown();
          setTimeout(() => inputRefs.current[0]?.focus(), 150);
        } else {
          // If resend fails (e.g., not admin), create new OTP
          await handleSendOTP();
        }
      } else {
        await handleSendOTP();
      }
    } catch {
      // Fallback: create new OTP via auth endpoint
      try {
        await handleSendOTP();
      } catch (err: any) {
        setError(err?.message || "Failed to resend OTP.");
      }
    } finally {
      setSending(false);
    }
  };

  // ─── Verify OTP (calls /auth/otp/verify) ──────────────────────────────

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

    if (!otpLogId) {
      setError("OTP session not found. Please request a new OTP.");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const res = await api.post("/auth/otp/verify", {
        email: user?.email || "",
        otp: otpString,
        otpLogId,
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          onVerify(otpString, otpLogId);
        }, 800);
      } else {
        setError(res.message || "Invalid OTP. Please try again.");
        // Clear last digit for retry
        const newOtp = [...otp];
        newOtp[5] = "";
        setOtp(newOtp);
        inputRefs.current[5]?.focus();
      }
    } catch (err: any) {
      const message = err?.message || "Verification failed.";
      setError(message);

      if (
        message.toLowerCase().includes("expired") ||
        message.toLowerCase().includes("maximum")
      ) {
        setOtp(["", "", "", "", "", ""]);
        setResendCooldown(0);
      }
    } finally {
      setVerifying(false);
    }
  };

  // ─── Input Handlers ───────────────────────────────────────────────────

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && otp.join("").length === 6) {
      handleVerify();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pastedData) return;

    const newOtp = ["", "", "", "", "", ""];
    pastedData.split("").forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    setError("");

    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  // ─── Helpers ──────────────────────────────────────────────────────────

  const getTypeDescription = () => {
    switch (type) {
      case "discount":
        return "An OTP will be sent to verify the discount override. This is required to modify the discount percentage beyond the allowed limit.";
      case "master_activation":
        return "An OTP will be sent to verify and activate this master record. New masters require OTP verification before they become active.";
      default:
        return "An OTP will be sent for verification.";
    }
  };

  if (!isOpen) return null;

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in mx-4">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
          disabled={verifying}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${success ? "bg-success/10" : "bg-accent/10"
              }`}
          >
            {success ? (
              <CheckCircle className="h-8 w-8 text-success" />
            ) : (
              <KeyRound className="h-8 w-8 text-accent" />
            )}
          </div>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground mt-2">{description}</p>
        </div>

        {/* ─── Step 1: Send OTP ───────────────────────────────────────── */}
        {!otpSent ? (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="text-muted-foreground">{getTypeDescription()}</p>
              {entityName && (
                <p className="mt-2 font-medium text-foreground">
                  Entity: <span className="text-accent">{entityName}</span>
                </p>
              )}
            </div>

            <Button
              onClick={handleSendOTP}
              className="w-full btn-accent gap-2 h-11"
              disabled={sending}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send OTP
                </>
              )}
            </Button>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm justify-center bg-destructive/5 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        ) : success ? (
          /* ─── Step 3: Success ─────────────────────────────────────── */
          <div className="text-center py-4">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <p className="text-success font-semibold text-lg">
              OTP Verified Successfully!
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Processing your request...
            </p>
          </div>
        ) : (
          /* ─── Step 2: Enter OTP ──────────────────────────────────── */
          <div className="space-y-5">
            {/* Sent info */}
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-center">
              <p className="text-muted-foreground">
                OTP sent to{" "}
                <span className="font-semibold text-foreground">
                  {sentToEmail || "admin"}
                </span>
              </p>
            </div>

            {/* OTP Inputs */}
            <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`otp-input transition-all ${error
                      ? "border-destructive ring-destructive/20"
                      : digit
                        ? "border-accent ring-accent/20"
                        : ""
                    }`}
                  disabled={verifying}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm justify-center bg-destructive/5 rounded-lg p-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Verify Button */}
            <Button
              onClick={handleVerify}
              className="w-full btn-accent gap-2 h-11"
              disabled={otp.join("").length !== 6 || verifying}
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Verify OTP
                </>
              )}
            </Button>

            {/* Resend */}
            <div className="text-center text-sm text-muted-foreground">
              Didn't receive OTP?{" "}
              {resendCooldown > 0 ? (
                <span className="text-accent font-medium">
                  Resend in {resendCooldown}s
                </span>
              ) : (
                <button
                  onClick={handleResendOTP}
                  className="text-accent hover:underline font-medium inline-flex items-center gap-1"
                  disabled={sending}
                >
                  {sending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  Resend
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OTPModal;
