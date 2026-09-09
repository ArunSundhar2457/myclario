import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, Download, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { supabase } from "@/integrations/supabase/client";
import type { Currency } from "@/lib/currency";
import { LANGUAGES, type Language } from "@/lib/i18n";
import { useLanguage } from "@/components/language-provider";
import { useTheme, type Theme } from "@/components/theme-provider";
import {
  deleteAccount,
  exportUserData,
  getProfile,
  updateProfile,
} from "@/lib/profile.functions";
import { APP_VERSION, BUILD_DATE } from "@/lib/version";

export function SettingsModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();

  const getProfileFn = useServerFn(getProfile);
  const updateProfileFn = useServerFn(updateProfile);
  const exportFn = useServerFn(exportUserData);
  const deleteFn = useServerFn(deleteAccount);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfileFn(),
    enabled: open,
  });

  const [displayName, setDisplayName] = useState("");
  const [currency, setLocalCurrency] = useState<Currency>("INR");
  const [language, setLocalLanguage] = useState<Language>("en");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setLocalCurrency((profile.currency as Currency) ?? "INR");
      setLocalLanguage(((profile as { language?: string }).language as Language) ?? "en");
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: () =>
      updateProfileFn({ data: { display_name: displayName || null, currency, language } }),
    onSuccess: () => {
      const previousLanguage =
        ((profile as { language?: string } | undefined)?.language as Language) ?? "en";
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success(t("settings.saved"));
      onOpenChange(false);
      if (language !== previousLanguage) {
        const label = LANGUAGES.find((l) => l.code === language)?.label ?? language;
        toast.success(t("settings.languageToast").replace("{language}", label), {
          duration: Infinity,
          action: {
            label: t("settings.refresh"),
            onClick: () => window.location.reload(),
          },
        });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const doExport = useMutation({
    mutationFn: () => exportFn(),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "clario-data-export.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(t("settings.exported"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const doDelete = useMutation({
    mutationFn: () => deleteFn(),
    onSuccess: async () => {
      await supabase.auth.signOut();
      toast.success(t("settings.deleted"));
      navigate({ to: "/auth", replace: true });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>{t("settings.title")}</DialogTitle>
            <DialogDescription>{t("settings.description")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="display_name">{t("settings.displayName")}</Label>
              <Input
                id="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("settings.displayNamePlaceholder")}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("settings.currency")}</Label>
              <Select
                value={currency}
                onValueChange={(v) => setLocalCurrency(v as Currency)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["INR", "USD", "EUR", "GBP"] as const).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("settings.language")}</Label>
              <Select
                value={language}
                onValueChange={(v) => setLocalLanguage(v as Language)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <Button
                variant="secondary"
                onClick={() => doExport.mutate()}
                disabled={doExport.isPending}
              >
                {doExport.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {t("settings.export")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setConfirmOpen(true)}
                disabled={doDelete.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("settings.delete")}
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              {t("settings.needHelp")}{" "}
              <a
                href="mailto:myclario.help@gmail.com"
                className="text-primary hover:underline"
              >
                myclario.help@gmail.com
              </a>
            </p>

            <p className="text-center text-xs text-muted-foreground">
              {t("settings.versionLine")
                .replace("{version}", APP_VERSION)
                .replace("{date}", BUILD_DATE)}
            </p>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || isLoading}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("settings.confirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                doDelete.mutate();
              }}
            >
              {doDelete.isPending ? t("settings.deleting") : t("settings.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
