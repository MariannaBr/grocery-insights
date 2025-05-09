import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import ReceiptUpload from "@/app/components/ReceiptUpload";

export default async function NewReceiptPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ReceiptUpload />
    </div>
  );
}
