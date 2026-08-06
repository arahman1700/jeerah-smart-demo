import * as Dialog from "@radix-ui/react-dialog";
import { useState, type FormEvent, type ReactNode } from "react";
import { useI18n } from "../../i18n/I18nProvider";

/**
 * A controlled admin edit dialog. `onSubmit` reads the form, returns an error
 * message to keep the dialog open, or null after dispatching to close it.
 */
export function EditDialog({
  title,
  open,
  onOpenChange,
  onSubmit,
  children,
  submitLabel,
}: {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (form: FormData) => Promise<string | null> | string | null;
  children: ReactNode;
  submitLabel?: string;
}) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await onSubmit(new FormData(event.currentTarget));
    setError(result);
    if (result === null) onOpenChange(false);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(null);
        onOpenChange(next);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="admin-drawer__overlay" />
        <Dialog.Content className="admin-dialog" aria-describedby={undefined}>
          <Dialog.Title className="admin-dialog__title">{title}</Dialog.Title>
          <form onSubmit={handleSubmit} noValidate>
            {children}
            {error ? (
              <p role="alert" className="admin-form__error">
                {error}
              </p>
            ) : null}
            <div className="admin-dialog__actions">
              <Dialog.Close asChild>
                <button type="button" className="admin-button admin-button--ghost">
                  {t("action.cancel")}
                </button>
              </Dialog.Close>
              <button type="submit" className="admin-button admin-button--primary">
                {submitLabel ?? t("action.save")}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function DialogField({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input name={name} defaultValue={defaultValue} />
    </label>
  );
}
