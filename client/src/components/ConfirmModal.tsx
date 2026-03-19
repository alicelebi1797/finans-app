import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui-elements";

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title = "Emin misiniz?",
  message,
  confirmText = "Sil",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onCancel}>
      <div
        className="glass rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-destructive/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Trash2 className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-lg mb-1">{title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{message}</p>
          </div>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-3 mt-5 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel}>İptal</Button>
          <Button variant="destructive" size="sm" onClick={onConfirm}>
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function useDel() {
  return (message: string, onConfirm: () => void) => {
    const el = document.createElement("div");
    el.id = "confirm-tmp-" + Date.now();
    document.body.appendChild(el);

    const cleanup = () => {
      const ReactDOM = (window as any).__REACT_DOM__;
      if (ReactDOM) ReactDOM.unmountComponentAtNode(el);
      el.remove();
    };
    cleanup();
  };
}
