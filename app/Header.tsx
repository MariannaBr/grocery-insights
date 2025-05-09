"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({
      redirect: false,
      callbackUrl: "/"
    });
    router.push("/");
  };

  return (
    <header className="w-full bg-white shadow-md py-4 px-8">
      <nav className="flex justify-between items-center">
        <Link
          href="/"
          className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors"
        >
          Grocery Insights
        </Link>
        <div className="flex items-center space-x-4">
          {session ? (
            <>
              <Link
                href="/receipts/upload"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                Upload Receipt
              </Link>
              <Link
                href="/profile"
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
              >
                Profile
              </Link>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  {session.user?.name && <div>{session.user.name}</div>}
                  <div>{session.user?.email}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
