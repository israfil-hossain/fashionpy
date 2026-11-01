import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, toast } from "@medusajs/ui";
import { Trash } from "@medusajs/icons";

import { FileUpload, FilePreview } from "@mercurjs/dashboard-shared";
import type { FileType } from "@mercurjs/dashboard-shared";
import { useImportProducts } from "../../../../hooks/api/products";
import { downloadImportTemplate } from "../helpers/import-template";

type UploadImportProps = {
  onSuccess: (summary: { created: number }) => void;
};

export const UploadImport = ({ onSuccess }: UploadImportProps) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<FileType | null>(null);

  const { mutateAsync: importProducts, isPending } = useImportProducts({
    onSuccess: (data) => {
      toast.success(
        `${t("products.import.uploadLabel")}: ${data.summary?.created ?? 0}`
      );
      onSuccess(data.summary);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFileUpload = (files: FileType[]) => {
    if (files.length > 0) {
      setFile(files[0] ?? null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    await importProducts(file.file);
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  return (
    <div className="flex flex-col gap-y-4">
      <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3">
        <span className="text-ui-fg-subtle txt-small">
          {t("products.import.template.description")}{" "}
          <button
            type="button"
            className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover underline"
            onClick={downloadImportTemplate}
          >
            {t("products.import.template.title")}
          </button>
        </span>
      </div>

      {!file ? (
        <FileUpload
          label={t("products.import.upload.title")}
          hint={t("products.import.uploadHint")}
          formats={[".csv", "text/csv"]}
          onUploaded={handleFileUpload}
          multiple={false}
        />
      ) : (
        <FilePreview
          filename={file.file.name}
          loading={isPending}
          activity={t("products.import.uploadLabel")}
          actions={[
            {
              actions: [
                {
                  icon: <Trash />,
                  label: t("actions.remove"),
                  onClick: handleRemoveFile,
                },
              ],
            },
          ]}
        />
      )}

      {file && (
        <div className="flex justify-end">
          <Button onClick={handleImport} isLoading={isPending} disabled={!file}>
            {t("products.import.uploadLabel")}
          </Button>
        </div>
      )}
    </div>
  );
};
