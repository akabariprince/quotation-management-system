import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Mail, Save, Loader2 } from "lucide-react";
import { getSetting, updateSetting } from "@/lib/api/settings";
import { useToast } from "@/components/ui/use-toast";

interface EmailConfigForm {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password?: string;
  from: string;
}

const Settings: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, watch } = useForm<EmailConfigForm>({
    defaultValues: {
      host: "",
      port: 587,
      secure: false,
      user: "",
      password: "",
      from: "",
    },
  });

  const isSecure = watch("secure");

  useEffect(() => {
    const fetchEmailConfig = async () => {
      try {
        const response = await getSetting("email_config");
        if (response.success && response.data) {
          reset(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch email config:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmailConfig();
  }, [reset]);

  const onSubmit = async (data: EmailConfigForm) => {
    setSaving(true);
    try {
      const payload = { ...data };
      if (payload.password === "") {
        delete payload.password;
      }

      const response = await updateSetting("email_config", payload);
      if (response.success) {
        toast({
          title: "Success",
          description: "Email configuration updated successfully.",
        });
        setValue("password", "");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update email configuration.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage application settings and configurations.
        </p>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/30">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            Email Configuration
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure SMTP server settings for sending emails (OTP, Quotations).
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                SMTP Host <span className="text-destructive">*</span>
              </label>
              <input
                {...register("host", { required: "SMTP Host is required" })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="e.g. smtp.gmail.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                SMTP Port <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                {...register("port", {
                  required: "SMTP Port is required",
                  valueAsNumber: true,
                })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="e.g. 587"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                Sender Email Address <span className="text-destructive">*</span>
              </label>
              <input
                type="email"
                {...register("user", { required: "Sender Email is required" })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="e.g. noreply@example.com"
                autoComplete="off"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                SMTP Password <span className="text-destructive">*</span>
              </label>
              <input
                type="password"
                {...register("password")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Leave blank to keep existing password"
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                If using Gmail, use an App Password. Leave blank to keep existing.
              </p>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">From Default Name</label>
              <input
                {...register("from")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder='e.g. ESIPL Quotation System <noreply@example.com>'
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 bg-muted/50 px-3 py-2.5 rounded-md border border-border">
                <input
                  type="checkbox"
                  id="secure"
                  {...register("secure")}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="secure" className="text-sm font-medium cursor-pointer flex-1">
                  Use Secure Connection (SSL/TLS)
                  <p className="text-xs text-muted-foreground font-normal mt-0.5">
                    Enable if your SMTP server requires SSL/TLS (typically Port 465).
                  </p>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end pt-3 border-t border-border">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-5"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;