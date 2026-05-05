import { redirect } from "next/navigation";

export default function PaymentsPage() {
  // Redirect to settlements since payment module was removed
  redirect("/settlements");
}
