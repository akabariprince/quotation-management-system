import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}) => {
  const iconMap = {
    danger: <Trash2 className="h-6 w-6 text-destructive" />,
    warning: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
    info: <AlertTriangle className="h-6 w-6 text-blue-500" />,
  };

  // ✅ Background now matches the variant
  const iconBgMap = {
    danger: "bg-destructive/10",
    warning: "bg-yellow-500/10",
    info: "bg-blue-500/10",
  };

  const buttonClassMap = {
    danger:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    warning: "bg-yellow-500 text-white hover:bg-yellow-600",
    info: "bg-blue-500 text-white hover:bg-blue-600",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {/* ✅ Fixed: shrink-0 prevents squishing, dynamic bg */}
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconBgMap[variant]}`}
            >
              {iconMap[variant]}
            </div>
            <div className="flex flex-col">
              <DialogTitle className="text-lg">{title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            className={buttonClassMap[variant]}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing...
              </div>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;