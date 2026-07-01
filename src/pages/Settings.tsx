import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, Loader2, Save, X } from "lucide-react";
import {
  getSetting,
  getWhatsAppTemplates,
  syncWhatsAppConfig,
  updateSetting,
} from "@/lib/api/settings";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmailConfigForm {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password?: string;
  from: string;
}

interface WhatsAppConfigForm {
  apiKey: string;
  wabaId: string;
  phoneNumberId: string;
  webhookSecret: string;
  wabaName?: string | null;
  wabaStatus?: string | null;
  metaWabaId?: string | null;
  businessId?: string | null;
  currency?: string | null;
  displayNumber?: string | null;
  verifiedName?: string | null;
  phoneStatus?: string | null;
  qualityRating?: string | null;
  qualityDisplay?: string | null;
  messagingTierLabel?: string | null;
  remainingQuota?: number | null;
  dailyLimit?: number | null;
  sentToday?: number | null;
  syncedAt?: string | null;
}

interface WhatsAppTemplateOption {
  id: string;
  name: string;
  status: string;
  category?: string | null;
  language?: string | null;
  components?: any;
}

type PreferenceKey =
  | "customer_otp_verification"
  | "user_otp_verification"
  | "discount_approval"
  | "project_quotation"
  | "login_notification"
  | "master_data_change"
  | "admin_notification";

type TemplateMap = Record<PreferenceKey, string>;
type PreferenceMap = Record<
  PreferenceKey,
  { email: boolean; whatsapp: boolean }
>;

type TemplatePreviewContext = {
  key: PreferenceKey;
  template: WhatsAppTemplateOption | null;
};

type TemplatePreviewConfig = {
  parameters: string[];
  documentHeader?: boolean;
  recommendedName?: string;
};

const preferenceLabels: Record<PreferenceKey, string> = {
  customer_otp_verification: "Customer OTP Verification",
  user_otp_verification: "User OTP Verification",
  discount_approval: "Discount Approval Notifications",
  project_quotation: "Project Quotation Notifications",
  login_notification: "Login Notifications",
  master_data_change: "Master Data Change Notifications",
  admin_notification: "Admin Notifications",
};

const defaultTemplates: TemplateMap = {
  customer_otp_verification: "",
  user_otp_verification: "",
  discount_approval: "",
  project_quotation: "",
  login_notification: "",
  master_data_change: "",
  admin_notification: "",
};

const defaultPreferences: PreferenceMap = {
  customer_otp_verification: { email: false, whatsapp: true },
  user_otp_verification: { email: false, whatsapp: true },
  discount_approval: { email: true, whatsapp: false },
  project_quotation: { email: true, whatsapp: false },
  login_notification: { email: true, whatsapp: false },
  master_data_change: { email: true, whatsapp: false },
  admin_notification: { email: true, whatsapp: false },
};

const defaultWhatsAppConfig: WhatsAppConfigForm = {
  apiKey: "",
  wabaId: "",
  phoneNumberId: "",
  webhookSecret: "",
  wabaName: null,
  wabaStatus: null,
  metaWabaId: null,
  businessId: null,
  currency: null,
  displayNumber: null,
  verifiedName: null,
  phoneStatus: null,
  qualityRating: null,
  qualityDisplay: null,
  messagingTierLabel: null,
  remainingQuota: null,
  dailyLimit: null,
  sentToday: null,
  syncedAt: null,
};

const whatsappTemplateKeys: PreferenceKey[] = [
  "customer_otp_verification",
  "user_otp_verification",
  "discount_approval",
  "project_quotation",
  "master_data_change",
];

const whatsappChannelKeys = new Set<PreferenceKey>([
  "customer_otp_verification",
  "user_otp_verification",
  "discount_approval",
  "project_quotation",
  "master_data_change",
]);

const visiblePreferenceKeys: PreferenceKey[] = [
  "customer_otp_verification",
  "user_otp_verification",
  "discount_approval",
  "project_quotation",
  "login_notification",
  "master_data_change",
  "admin_notification",
];

const emailChannelKeys = new Set<PreferenceKey>([
  "discount_approval",
  "project_quotation",
  "login_notification",
  "master_data_change",
  "admin_notification",
]);

const SettingsSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-24 w-full rounded-lg" />
    <Skeleton className="h-24 w-full rounded-lg" />
    <Skeleton className="h-32 w-full rounded-lg" />
  </div>
);

const cardClass =
  "bg-card rounded-lg border border-border shadow-sm overflow-hidden";

const sectionTitleClass = "text-xs font-semibold";
const fieldClass =
  "flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const replaceTemplateVariables = (
  text: string,
  values: Record<string, string> = {},
) =>
  text.replace(/\{\{(\d+)\}\}/g, (_match, key) => values[key] || `{{${key}}}`);

const templateParameterCatalog: Record<PreferenceKey, TemplatePreviewConfig> = {
  customer_otp_verification: {
    parameters: ["OTP code"],
    recommendedName: "customer_otp_code",
  },
  user_otp_verification: {
    parameters: ["OTP code"],
    recommendedName: "user_otp_code",
  },
  discount_approval: {
    parameters: ["OTP code"],
    recommendedName: "discount_approval_otp_code",
  },
  project_quotation: {
    parameters: [
      "Customer name",
      "Total value incl. GST",
      "Project number",
      "Customer name",
      "Quotation item count",
      "Grand total incl. GST",
    ],
    documentHeader: true,
    recommendedName: "customer_project_quotation",
  },
  login_notification: {
    parameters: [],
  },
  master_data_change: {
    parameters: ["OTP code"],
    recommendedName: "master_data_change_otp_code",
  },
  admin_notification: {
    parameters: [],
  },
};

const extractTemplateVariableNumbers = (template?: WhatsAppTemplateOption | null) => {
  const values = new Set<number>();
  const strings: string[] = [];
  const form = template?.components?.inboundsageForm;
  if (form) {
    if (form.body) strings.push(form.body);
    if (form.footer) strings.push(form.footer);
    if (form.headerText) strings.push(form.headerText);
  }

  const meta = Array.isArray(template?.components?.meta)
    ? template.components.meta
    : [];
  meta.forEach((component: any) => {
    if (typeof component?.text === "string") strings.push(component.text);
    if (typeof component?.body === "string") strings.push(component.body);
  });

  strings.forEach((text) => {
    const matches = text.match(/\{\{(\d+)\}\}/g) || [];
    matches.forEach((match) => {
      const parsed = Number(match.replace(/[{}]/g, ""));
      if (Number.isFinite(parsed)) values.add(parsed);
    });
  });

  return Array.from(values).sort((a, b) => a - b);
};

const getTemplatePreviewData = (template?: WhatsAppTemplateOption | null) => {
  const form = template?.components?.inboundsageForm || {};
  const metaComponents = Array.isArray(template?.components?.meta)
    ? template?.components?.meta
    : [];

  const bodyFromMeta = metaComponents.find((item: any) => item.type === "BODY");
  const footerFromMeta = metaComponents.find(
    (item: any) => item.type === "FOOTER",
  );
  const buttonsFromMeta = metaComponents.find(
    (item: any) => item.type === "BUTTONS",
  );

  const examples =
    form.variableExamples ||
    Object.fromEntries(
      ((bodyFromMeta?.example?.body_text?.[0] as string[]) || []).map(
        (value, index) => [String(index + 1), value],
      ),
    );

  return {
    headerType: form.headerType || "NONE",
    buttonMode: form.buttonMode || "NONE",
    body: replaceTemplateVariables(
      form.body || form.authBody || bodyFromMeta?.text || "",
      examples,
    ),
    footer:
      form.footer ||
      (footerFromMeta?.text
        ? replaceTemplateVariables(footerFromMeta.text, examples)
        : ""),
    buttons: form.buttons || buttonsFromMeta?.buttons || [],
  };
};

const WhatsAppTemplatePreviewModal = ({
  previewContext,
  onClose,
}: {
  previewContext: TemplatePreviewContext | null;
  onClose: () => void;
}) => {
  const template = previewContext?.template || null;
  if (!template) return null;

  const preview = getTemplatePreviewData(template);
  const selectedKey = previewContext?.key;
  const expectedConfig = selectedKey
    ? templateParameterCatalog[selectedKey]
    : { parameters: [] };
  const requiredVariables = extractTemplateVariableNumbers(template);
  const parameterCountMatches =
    requiredVariables.length === expectedConfig.parameters.length;
  const isMediaHeader = ["IMAGE", "VIDEO", "DOC", "DOCUMENT"].includes(
    String(preview.headerType).toUpperCase(),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative mx-4 w-full max-w-3xl rounded-md border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">WhatsApp Template Preview</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {template.name} ({template.status})
            </p>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-[240px_1fr]">
          <div className="rounded-xl border border-border bg-[#e5ddd5] p-3">
            <div className="rounded-2xl bg-[#dcf8c6] px-3 py-2 shadow-sm">
              {preview.headerType === "TEXT" && (
                <p className="mb-2 text-xs font-semibold text-foreground">
                  Template Header
                </p>
              )}
              {isMediaHeader && (
                <div className="mb-2 rounded-lg border border-border bg-white/70 p-3 text-center text-[11px] text-muted-foreground">
                  {preview.headerType} header preview
                </div>
              )}
              <div className="whitespace-pre-wrap text-xs text-foreground">
                {preview.body || "No body content"}
              </div>
              {preview.footer && (
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {preview.footer}
                </p>
              )}
              {Array.isArray(preview.buttons) && preview.buttons.length > 0 && (
                <div className="mt-3 space-y-1">
                  {preview.buttons.map((button: any, index: number) => (
                    <div
                      key={`${template.id}-btn-${index}`}
                      className="rounded-md border border-[#c7e7b7] bg-white/70 px-2 py-1 text-center text-[11px] font-medium text-[#128c7e]"
                    >
                      {button.text || button.type || `Button ${index + 1}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-md border border-border bg-muted/20 p-3">
              <p className="text-xs font-semibold">Template Details</p>
              <div className="mt-2 grid gap-2 text-xs md:grid-cols-2">
                <p>
                  <span className="text-muted-foreground">Name:</span>{" "}
                  {template.name}
                </p>
                <p>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  {template.status}
                </p>
                <p>
                  <span className="text-muted-foreground">Category:</span>{" "}
                  {template.category || "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Language:</span>{" "}
                  {template.language || "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Header:</span>{" "}
                  {preview.headerType}
                </p>
                <p>
                  <span className="text-muted-foreground">Buttons:</span>{" "}
                  {preview.buttonMode}
                </p>
              </div>
            </div>

            <div className="rounded-md border border-border bg-muted/20 p-3">
              <p className="text-xs font-semibold">App Parameter Check</p>
              <div className="mt-2 space-y-2 text-xs">
                <p>
                  <span className="text-muted-foreground">Notification:</span>{" "}
                  {selectedKey ? preferenceLabels[selectedKey] : "Unknown"}
                </p>
                {expectedConfig.recommendedName && (
                  <p>
                    <span className="text-muted-foreground">Recommended name:</span>{" "}
                    {expectedConfig.recommendedName}
                  </p>
                )}
                <p>
                  <span className="text-muted-foreground">Template variables:</span>{" "}
                  {requiredVariables.length
                    ? requiredVariables.map((value) => `{{${value}}}`).join(", ")
                    : "None"}
                </p>
                <p>
                  <span className="text-muted-foreground">App sends:</span>{" "}
                  {expectedConfig.parameters.length}
                </p>
                <p
                  className={
                    parameterCountMatches
                      ? "text-emerald-600 font-medium"
                      : "text-amber-600 font-medium"
                  }
                >
                  {parameterCountMatches
                    ? "Template variable count matches the app payload."
                    : "Template variable count does not match the app payload."}
                </p>
                {expectedConfig.documentHeader && (
                  <p className="text-muted-foreground">
                    This notification also sends the quotation PDF as a document
                    header when the selected template uses a document header.
                  </p>
                )}
              </div>
              {expectedConfig.parameters.length > 0 && (
                <div className="mt-3 rounded-md border border-border bg-background/70 p-2">
                  <p className="text-[11px] font-semibold">Parameters from app</p>
                  <div className="mt-2 space-y-1">
                    {expectedConfig.parameters.map((parameter, index) => (
                      <p key={`${selectedKey}-${index}`} className="text-[11px]">
                        <span className="text-muted-foreground">
                          {`{{${index + 1}}}`}:
                        </span>{" "}
                        {parameter}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToggleRow = ({
  label,
  email,
  whatsapp,
  showEmail,
  showWhatsApp,
  onChange,
}: {
  label: string;
  email: boolean;
  whatsapp: boolean;
  showEmail: boolean;
  showWhatsApp: boolean;
  onChange: (channel: "email" | "whatsapp", value: boolean) => void;
}) => (
  <div className="grid grid-cols-1 gap-2 border-b border-border/60 py-2 last:border-b-0 md:grid-cols-[1fr_auto_auto] md:items-center">
    <div className="text-xs font-medium">{label}</div>
    {showEmail ? (
      <label className="flex items-center gap-2 text-xs bg-muted/40 border border-border rounded-md px-2.5 py-2">
        <input
          type="checkbox"
          checked={email}
          onChange={(e) => onChange("email", e.target.checked)}
        />
        Email
      </label>
    ) : (
      <div className="flex items-center justify-center text-[10px] text-muted-foreground bg-muted/20 border border-dashed border-border rounded-md px-2.5 py-2">
        Not used on Email
      </div>
    )}
    {showWhatsApp ? (
      <label className="flex items-center gap-2 text-xs bg-muted/40 border border-border rounded-md px-2.5 py-2">
        <input
          type="checkbox"
          checked={whatsapp}
          onChange={(e) => onChange("whatsapp", e.target.checked)}
        />
        WhatsApp
      </label>
    ) : (
      <div className="flex items-center justify-center text-[10px] text-muted-foreground bg-muted/20 border border-dashed border-border rounded-md px-2.5 py-2">
        Not used on WhatsApp
      </div>
    )}
  </div>
);

const Settings: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [savingEmail, setSavingEmail] = useState(false);
  const [syncingWhatsApp, setSyncingWhatsApp] = useState(false);
  const [savingTemplates, setSavingTemplates] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [whatsAppConfig, setWhatsAppConfig] = useState<WhatsAppConfigForm>(
    defaultWhatsAppConfig,
  );
  const [templateNames, setTemplateNames] =
    useState<TemplateMap>(defaultTemplates);
  const [preferences, setPreferences] =
    useState<PreferenceMap>(defaultPreferences);
  const [templateOptions, setTemplateOptions] = useState<
    WhatsAppTemplateOption[]
  >([]);
  const [previewContext, setPreviewContext] =
    useState<TemplatePreviewContext | null>(null);

  const { register, handleSubmit, reset, setValue } = useForm<EmailConfigForm>({
    defaultValues: {
      host: "",
      port: 587,
      secure: false,
      user: "",
      password: "",
      from: "",
    },
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [
          emailConfig,
          whatsappConfig,
          whatsappTemplates,
          notificationPrefs,
        ] = await Promise.all([
          getSetting("email_config"),
          getSetting("whatsapp_config"),
          getSetting("whatsapp_templates"),
          getSetting("notification_preferences"),
        ]);

        if (emailConfig.success && emailConfig.data) reset(emailConfig.data);
        if (whatsappConfig.success && whatsappConfig.data) {
          setWhatsAppConfig({
            ...defaultWhatsAppConfig,
            ...whatsappConfig.data,
          });
        }
        if (whatsappTemplates.success && whatsappTemplates.data) {
          setTemplateNames({
            ...defaultTemplates,
            ...whatsappTemplates.data,
          });
        }
        if (notificationPrefs.success && notificationPrefs.data) {
          setPreferences({
            ...defaultPreferences,
            ...notificationPrefs.data,
          });
        }

        setTemplatesLoading(true);
        try {
          const templateList = await getWhatsAppTemplates();
          setTemplateOptions(templateList.data || []);
        } finally {
          setTemplatesLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [reset]);

  const onSubmitEmail = async (data: EmailConfigForm) => {
    setSavingEmail(true);
    try {
      const payload = { ...data };
      if (payload.password === "") delete payload.password;
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
      setSavingEmail(false);
    }
  };

  const handleSyncWhatsApp = async () => {
    setSyncingWhatsApp(true);
    try {
      const response = await syncWhatsAppConfig(whatsAppConfig.apiKey);
      if (response.success) {
        setWhatsAppConfig({
          ...defaultWhatsAppConfig,
          ...(response.data?.config || {}),
        });
        toast({
          title: "Success",
          description: "WhatsApp configuration synced successfully.",
        });

        setTemplatesLoading(true);
        try {
          const templateList = await getWhatsAppTemplates();
          setTemplateOptions(templateList.data || []);
        } finally {
          setTemplatesLoading(false);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to sync WhatsApp configuration.",
        variant: "destructive",
      });
    } finally {
      setSyncingWhatsApp(false);
    }
  };

  const saveTemplates = async () => {
    setSavingTemplates(true);
    try {
      const response = await updateSetting("whatsapp_templates", templateNames);
      if (response.success) {
        toast({
          title: "Success",
          description: "WhatsApp template names updated successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to update WhatsApp template names.",
        variant: "destructive",
      });
    } finally {
      setSavingTemplates(false);
    }
  };

  const savePreferences = async () => {
    setSavingPreferences(true);
    try {
      const response = await updateSetting(
        "notification_preferences",
        preferences,
      );
      if (response.success) {
        toast({
          title: "Success",
          description: "Notification channel settings updated successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update notification settings.",
        variant: "destructive",
      });
    } finally {
      setSavingPreferences(false);
    }
  };

  if (loading) return <SettingsSkeleton />;

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-sm font-semibold leading-none">Settings</h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          Manage email, WhatsApp, templates, and notification channels.
        </p>
      </div>

      <div className={cardClass}>
        <div className="px-4 py-2 border-b border-border bg-muted/30">
          <h2 className={sectionTitleClass}>Email Configuration</h2>
        </div>
        <form onSubmit={handleSubmit(onSubmitEmail)} className="px-4 py-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">SMTP Host</Label>
              <Input
                {...register("host")}
                className={fieldClass}
                placeholder="e.g. smtp.gmail.com"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">SMTP Port</Label>
              <Input
                type="number"
                {...register("port", { valueAsNumber: true })}
                className={fieldClass}
                placeholder="e.g. 587"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Sender Email Address</Label>
              <Input
                type="email"
                {...register("user")}
                className={fieldClass}
                placeholder="e.g. noreply@example.com"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">SMTP Password</Label>
              <Input
                type="password"
                {...register("password")}
                className={fieldClass}
                placeholder="Leave blank to keep existing password"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">From Default Name</Label>
              <Input
                {...register("from")}
                className={fieldClass}
                placeholder="e.g. ESIPL Quotation System <noreply@example.com>"
              />
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 bg-muted/50 px-2.5 py-2 rounded-md border border-border">
                <input
                  type="checkbox"
                  {...register("secure")}
                  className="h-3.5 w-3.5"
                />
                <div>
                  <p className="text-xs font-medium">
                    Use Secure Connection (SSL/TLS)
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Enable if your SMTP server requires SSL/TLS.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 flex justify-end border-t border-border pt-2">
            <button
              type="submit"
              disabled={savingEmail}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground"
            >
              {savingEmail ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              Save Email
            </button>
          </div>
        </form>
      </div>

      <div className={cardClass}>
        <div className="px-4 py-2 border-b border-border bg-muted/30">
          <h2 className={sectionTitleClass}>WhatsApp Settings</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Enter API key and sync WABA details from InboundSage.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 px-4 py-3">
          <div className="space-y-1">
            <Label className="text-xs">API Key</Label>
            <Input
              value={whatsAppConfig.apiKey}
              onChange={(e) =>
                setWhatsAppConfig((prev) => ({
                  ...prev,
                  apiKey: e.target.value,
                }))
              }
              className={fieldClass}
              placeholder="InboundSage API Key"
            />
          </div>
          <div className="rounded-md border border-border bg-muted/20 p-3">
            <p className="text-xs font-semibold">Synced Account Details</p>
            <div className="mt-2 grid gap-2 text-xs md:grid-cols-2">
              <p><span className="text-muted-foreground">WABA Name:</span> {whatsAppConfig.wabaName || "Not synced"}</p>
              <p><span className="text-muted-foreground">WABA Status:</span> {whatsAppConfig.wabaStatus || "—"}</p>
              <p><span className="text-muted-foreground">WABA ID:</span> {whatsAppConfig.wabaId || "—"}</p>
              <p><span className="text-muted-foreground">Meta WABA ID:</span> {whatsAppConfig.metaWabaId || "—"}</p>
              <p><span className="text-muted-foreground">Business ID:</span> {whatsAppConfig.businessId || "—"}</p>
              <p><span className="text-muted-foreground">Currency:</span> {whatsAppConfig.currency || "—"}</p>
              <p><span className="text-muted-foreground">Display Number:</span> {whatsAppConfig.displayNumber || "—"}</p>
              <p><span className="text-muted-foreground">Verified Name:</span> {whatsAppConfig.verifiedName || "—"}</p>
              <p><span className="text-muted-foreground">Phone Number ID:</span> {whatsAppConfig.phoneNumberId || "—"}</p>
              <p><span className="text-muted-foreground">Phone Status:</span> {whatsAppConfig.phoneStatus || "—"}</p>
              <p><span className="text-muted-foreground">Quality:</span> {whatsAppConfig.qualityDisplay || whatsAppConfig.qualityRating || "—"}</p>
              <p><span className="text-muted-foreground">Messaging Tier:</span> {whatsAppConfig.messagingTierLabel || "—"}</p>
              <p><span className="text-muted-foreground">Sent Today:</span> {whatsAppConfig.sentToday ?? "—"}</p>
              <p><span className="text-muted-foreground">Remaining Quota:</span> {whatsAppConfig.remainingQuota ?? "—"}</p>
              <p><span className="text-muted-foreground">Daily Limit:</span> {whatsAppConfig.dailyLimit ?? "—"}</p>
              <p><span className="text-muted-foreground">Last Synced:</span> {whatsAppConfig.syncedAt ? new Date(whatsAppConfig.syncedAt).toLocaleString("en-IN") : "—"}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end border-t border-border px-4 py-2">
          <button
            type="button"
            disabled={syncingWhatsApp}
            onClick={handleSyncWhatsApp}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground"
          >
            {syncingWhatsApp ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            Sync WhatsApp
          </button>
        </div>
      </div>

      <div className={cardClass}>
        <div className="px-4 py-2 border-b border-border bg-muted/30">
          <h2 className={sectionTitleClass}>WhatsApp Template Names</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Pick template names from the InboundSage API list.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 px-4 py-3 md:grid-cols-2">
          {whatsappTemplateKeys.map((key) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs">{preferenceLabels[key]}</Label>
              <div className="flex gap-2">
                <Select
                  value={templateNames[key] || "__none__"}
                  onValueChange={(value) =>
                    setTemplateNames((prev) => ({
                      ...prev,
                      [key]: value === "__none__" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger className={fieldClass}>
                    <SelectValue
                      placeholder={
                        templatesLoading
                          ? "Loading templates..."
                          : "Select template"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      No template selected
                    </SelectItem>
                    {templateOptions.map((option) => (
                      <SelectItem key={option.id} value={option.name}>
                        {option.name} ({option.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-input px-2 text-xs"
                  disabled={!templateNames[key]}
                  onClick={() =>
                    setPreviewContext({
                      key,
                      template:
                        templateOptions.find(
                          (option) => option.name === templateNames[key],
                        ) || null,
                    })
                  }
                >
                  <Eye className="h-3 w-3" />
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end border-t border-border px-4 py-2">
          <button
            type="button"
            disabled={savingTemplates}
            onClick={saveTemplates}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground"
          >
            {savingTemplates ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            Save Templates
          </button>
        </div>
      </div>

      <div className={cardClass}>
        <div className="px-4 py-2 border-b border-border bg-muted/30">
          <h2 className={sectionTitleClass}>Notification Channels</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Enable email and WhatsApp independently for each notification type.
          </p>
        </div>
        <div className="px-4 py-2">
          {visiblePreferenceKeys.map((key) => (
            <ToggleRow
              key={key}
              label={preferenceLabels[key]}
              email={preferences[key].email}
              whatsapp={preferences[key].whatsapp}
              showEmail={emailChannelKeys.has(key)}
              showWhatsApp={whatsappChannelKeys.has(key)}
              onChange={(channel, value) =>
                setPreferences((prev) => ({
                  ...prev,
                  [key]: {
                    ...prev[key],
                    [channel]: value,
                  },
                }))
              }
            />
          ))}
        </div>
        <div className="flex justify-end border-t border-border px-4 py-2">
          <button
            type="button"
            disabled={savingPreferences}
            onClick={savePreferences}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground"
          >
            {savingPreferences ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            Save Notification Settings
          </button>
        </div>
      </div>

      <WhatsAppTemplatePreviewModal
        previewContext={previewContext}
        onClose={() => setPreviewContext(null)}
      />
    </div>
  );
};

export default Settings;
