import { Button, Input, Select, Switch, Text } from "@medusajs/ui"
import { useFieldArray } from "react-hook-form"

import { useTabbedForm } from "../../../../../components/tabbed-form/tabbed-form"
import { defineTabMeta } from "../../../../../components/tabbed-form/types"
import { ProductCreateSchemaType } from "../../types"

const Root = () => {
  const form = useTabbedForm<ProductCreateSchemaType>()
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "customization_fields",
  })

  return (
    <div
      className="flex flex-col items-center p-16"
      data-testid="product-create-customization-form"
    >
      <div className="flex w-full max-w-[720px] flex-col gap-y-6">
        <div className="bg-ui-bg-component flex items-start gap-x-3 rounded-lg p-3">
          <Switch
            checked={form.watch("customization_enabled") ?? false}
            onCheckedChange={value =>
              form.setValue("customization_enabled", value, {
                shouldDirty: true,
              })
            }
            data-testid="customization-enabled"
          />
          <div>
            <Text size="small" weight="plus" leading="compact">
              Product customization
            </Text>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              Let customers add text or upload a file for this product.
            </Text>
          </div>
        </div>

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="border-ui-border-base grid grid-cols-2 gap-3 rounded-lg border p-4 lg:grid-cols-3"
          >
            <div className="flex flex-col gap-y-1">
              <Text size="small" weight="plus">Field label</Text>
              <Input
                {...form.register(`customization_fields.${index}.label`)}
                placeholder="Gift message"
                data-testid={`customization-label-${index}`}
              />
            </div>
            <div className="flex flex-col gap-y-1">
              <Text size="small" weight="plus">Key</Text>
              <Input
                {...form.register(`customization_fields.${index}.key`)}
                placeholder="gift_message"
                data-testid={`customization-key-${index}`}
              />
            </div>
            <div className="flex flex-col gap-y-1">
              <Text size="small" weight="plus">Type</Text>
              <Select
                value={form.watch(`customization_fields.${index}.type`)}
                onValueChange={value =>
                  form.setValue(`customization_fields.${index}.type`, value as "text" | "file", {
                    shouldDirty: true,
                  })
                }
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="text">Text</Select.Item>
                  <Select.Item value="file">File upload</Select.Item>
                </Select.Content>
              </Select>
            </div>
            <div className="flex items-center gap-x-2">
              <Switch
                checked={form.watch(`customization_fields.${index}.required`) ?? false}
                onCheckedChange={value =>
                  form.setValue(`customization_fields.${index}.required`, value, {
                    shouldDirty: true,
                  })
                }
              />
              <Text size="small">Required</Text>
            </div>
            <div className="flex flex-col gap-y-1">
              <Text size="small" weight="plus">Max length</Text>
              <Input
                type="number"
                {...form.register(`customization_fields.${index}.max_length`)}
                data-testid={`customization-max-${index}`}
              />
            </div>
            <div className="flex flex-col gap-y-1">
              <Text size="small" weight="plus">Extra price (BDT)</Text>
              <Input
                type="number"
                {...form.register(`customization_fields.${index}.extra_price`)}
                data-testid={`customization-price-${index}`}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              className="col-span-full w-fit"
              onClick={() => remove(index)}
              data-testid={`customization-remove-${index}`}
            >
              Remove field
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="secondary"
          className="w-fit"
          onClick={() =>
            append({ key: "", label: "", type: "text", required: false })
          }
          data-testid="customization-add-field"
        >
          Add customization field
        </Button>

      </div>
    </div>
  )
}

Root._tabMeta = defineTabMeta<ProductCreateSchemaType>({
  id: "customization",
  labelKey: "products.create.tabs.customization",
  validationFields: ["customization_enabled", "customization_fields"],
})

export const ProductCreateCustomizationForm = Root
