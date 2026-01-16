import type { Metadata } from "next";
import { CheckoutContent } from "./checkout-content";

export const metadata: Metadata = {
  title: "Ödeme | MyTrip",
  description: "Abonelik ödemesi yapın ve işletme hesabınızı aktifleştirin.",
};

export default function CheckoutPage() {
  return <CheckoutContent />;
}
