import type { Metadata } from "next";
import { CheckoutContent } from "./checkout-content";

export const metadata: Metadata = {
  title: "Ödeme",
  description: "Abonelik ödemesi yapın ve işletme hesabınızı aktifleştirin.",
};

export default function CheckoutPage() {
  return <CheckoutContent />;
}
