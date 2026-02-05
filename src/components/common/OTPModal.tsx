import React, { useState, useRef, useEffect } from 'react';
import { X, KeyRound, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string) => void;
  title: string;
  description: string;
  type: 'discount' | 'master_activation';
}

const OTPModal: React.FC<OTPModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  title,
  description,
  type,
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setOtp(['', '', '', '', '', '']);
      setError('');
      setSuccess(false);
      setOtpSent(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
  };

  const handleSendOTP = () => {
    // Simulate sending OTP to admin
    setOtpSent(true);
  };

  const handleVerify = () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }

    // Static OTP: 123456
    if (otpString === '123456') {
      setSuccess(true);
      setTimeout(() => {
        onVerify(otpString);
      }, 1000);
    } else {
      setError('Invalid OTP. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="h-8 w-8 text-accent" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground mt-2">{description}</p>
        </div>

        {!otpSent ? (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="text-muted-foreground">
                An OTP will be sent to the Admin for approval. 
                {type === 'discount' && ' This is required to modify the discount percentage.'}
                {type === 'master_activation' && ' This is required to activate the master record.'}
              </p>
            </div>
            <Button onClick={handleSendOTP} className="w-full btn-accent">
              Send OTP to Admin
            </Button>
          </div>
        ) : success ? (
          <div className="text-center py-4">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
            <p className="text-success font-medium">OTP Verified Successfully!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="text-muted-foreground">
                OTP has been sent to Admin. Use <span className="font-mono font-semibold">123456</span> for testing.
              </p>
            </div>

            <div className="flex justify-center gap-2" onPaste={handlePaste}>
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
                  className="otp-input"
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm justify-center">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <Button onClick={handleVerify} className="w-full btn-accent">
              Verify OTP
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Didn't receive OTP?{' '}
              <button onClick={handleSendOTP} className="text-accent hover:underline">
                Resend
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OTPModal;
