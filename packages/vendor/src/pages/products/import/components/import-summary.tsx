import { CheckCircle } from "@medusajs/icons";
import { Heading, Text } from "@medusajs/ui";

type ImportSummaryProps = {
  created: number;
};

export const ImportSummary = ({ created }: ImportSummaryProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-y-4 py-8">
      <div className="flex size-12 items-center justify-center rounded-full bg-ui-bg-success">
        <CheckCircle className="text-ui-fg-on-color size-6" />
      </div>
      <div className="text-center">
        <Heading level="h3" className="mb-2">
          Import Complete
        </Heading>
        <Text className="text-ui-fg-subtle">
          Successfully imported {created} product{created !== 1 ? "s" : ""}.
        </Text>
      </div>
      <Text className="text-ui-fg-subtle txt-small text-center">
        Your products have been created as drafts. You can review and publish
        them from your product list.
      </Text>
    </div>
  );
};
