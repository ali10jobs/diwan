import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { CustomersView } from "@/components/customers/CustomersView";

export default async function CustomersPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-10">
      <CustomersView />
    </div>
  );
}
