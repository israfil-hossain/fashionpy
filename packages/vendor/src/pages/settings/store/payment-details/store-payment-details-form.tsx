import i18n from "i18next";
import { Button, Input, Select, toast } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import * as zod from "zod";

import { FormExtensionZone, useExtendableForm } from "@mercurjs/dashboard-shared";

import { Form } from "@components/common/form";
import { CountrySelect } from "@components/inputs/country-select/country-select";
import { RouteDrawer, useRouteModal } from "@components/modals";
import { KeyboundForm } from "@components/utilities/keybound-form";
import { HttpTypes } from "@mercurjs/types";
import { useUpdateSellerPaymentDetails } from "@hooks/api";

type StorePaymentDetailsFormProps = {
  seller: HttpTypes.StoreSellerResponse["seller"];
};

const StorePaymentDetailsSchema = zod.object({
  country_code: zod
    .string()
    .min(1, {
      message: i18n.t("store.paymentDetails.validation.countryRequired"),
    }),
  holder_name: zod
    .string()
    .min(1, {
      message: i18n.t("store.paymentDetails.validation.accountNameRequired"),
    }),
  payout_method: zod.enum(["bank", "bkash", "nagad"]),
  wallet_number: zod.string().optional().or(zod.literal("")),
  iban: zod.string().optional().or(zod.literal("")),
  bic: zod.string().optional().or(zod.literal("")),
  routing_number: zod.string().optional().or(zod.literal("")),
  account_number: zod.string().optional().or(zod.literal("")),
});

export const StorePaymentDetailsForm = ({
  seller,
}: StorePaymentDetailsFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const details = seller.payment_details;

  const form = useExtendableForm({
    schema: StorePaymentDetailsSchema,
    model: "seller",
    zone: "payment-details",
    data: seller,
    defaultValues: {
      country_code: details?.country_code ?? "",
      holder_name: details?.holder_name ?? "",
      payout_method: (details?.payout_method as "bank" | "bkash" | "nagad") ?? "bank",
      wallet_number: details?.wallet_number ?? "",
      iban: details?.iban ?? "",
      bic: details?.bic ?? "",
      routing_number: details?.routing_number ?? "",
      account_number: details?.account_number ?? "",
    },
  });

  const selectedCountry = form.watch("country_code");
  const payoutMethod = form.watch("payout_method");
  const isWallet = payoutMethod === "bkash" || payoutMethod === "nagad";

  const { mutateAsync, isPending } = useUpdateSellerPaymentDetails(seller.id);

  const handleSubmit = form.handleSubmit(async (values) => {
    const isABA = values.country_code === "us";
    await mutateAsync(
      {
        country_code: values.country_code,
        holder_name: values.holder_name,
        payout_method: values.payout_method,
        wallet_number: isWallet ? values.wallet_number || null : null,
        iban: !isWallet && !isABA ? values.iban || null : null,
        bic: !isWallet && !isABA ? values.bic || null : null,
        routing_number: !isWallet && isABA ? values.routing_number || null : null,
        account_number: !isWallet ? values.account_number || null : null,
        additional_data: values.additional_data,
      },
      {
        onSuccess: () => {
          toast.success(
            t("store.paymentDetails.edit.successToast"),
          );
          handleSuccess();
        },
        onError: (error: Error) => {
          toast.error(error.message);
        },
      },
    );
  });

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex flex-col gap-y-4 overflow-y-auto">
          <Form.Field
            control={form.control}
            name="country_code"
            render={({ field: { onChange, ref: _ref, ...field } }) => (
              <Form.Item>
                <Form.Label>
                  {t("store.paymentDetails.fields.countryCode")}
                </Form.Label>
                <Form.Control>
                  <CountrySelect {...field} onChange={onChange} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="holder_name"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>
                  {t("store.paymentDetails.fields.holderName")}
                </Form.Label>
                <Form.Control>
                  <Input size="small" {...field} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="payout_method"
            render={({ field: { onChange, ref: _ref, ...field } }) => (
              <Form.Item>
                <Form.Label>
                  {t("store.paymentDetails.fields.payoutMethod")}
                </Form.Label>
                <Form.Control>
                  <Select onValueChange={onChange} {...field}>
                    <Select.Trigger ref={_ref}>
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="bank">
                        {t("store.paymentDetails.payoutMethods.bank")}
                      </Select.Item>
                      <Select.Item value="bkash">
                        {t("store.paymentDetails.payoutMethods.bkash")}
                      </Select.Item>
                      <Select.Item value="nagad">
                        {t("store.paymentDetails.payoutMethods.nagad")}
                      </Select.Item>
                    </Select.Content>
                  </Select>
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          {isWallet ? (
            <Form.Field
              control={form.control}
              name="wallet_number"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>
                    {t("store.paymentDetails.fields.walletNumber")}
                  </Form.Label>
                  <Form.Control>
                    <Input size="small" inputMode="numeric" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          ) : selectedCountry === "us" ? (
            <>
              <Form.Field
                control={form.control}
                name="account_number"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label optional>
                      {t("store.paymentDetails.fields.accountNumber")}
                    </Form.Label>
                    <Form.Control>
                      <Input size="small" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="routing_number"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label optional>
                      {t("store.paymentDetails.fields.achRoutingNumber")}
                    </Form.Label>
                    <Form.Control>
                      <Input size="small" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </>
          ) : (
            <>
              <Form.Field
                control={form.control}
                name="iban"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label optional>
                      {t("store.paymentDetails.fields.iban")}
                    </Form.Label>
                    <Form.Control>
                      <Input size="small" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="account_number"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label optional>
                      {t("store.paymentDetails.fields.accountNumber")}
                    </Form.Label>
                    <Form.Control>
                      <Input size="small" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="bic"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label optional>
                      {t("store.paymentDetails.fields.swiftBic")}
                    </Form.Label>
                    <Form.Control>
                      <Input size="small" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </>
          )}
          <FormExtensionZone
            model="seller"
            zone="payment-details"
            control={form.control}
            data={seller}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button type="submit" size="small" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
