"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <header className="bg-white shadow">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link
              href="/"
              className="flex items-center px-2 py-2 text-gray-900 hover:text-gray-600"
            >
              Grocery Insights
            </Link>
          </div>

          <div className="flex items-center">
            {user ? (
              <>
                <Link
                  href="/receipts"
                  className="px-3 py-2 text-gray-900 hover:text-gray-600"
                >
                  Receipts
                </Link>
                <Link
                  href="/insights"
                  className="px-3 py-2 text-gray-900 hover:text-gray-600"
                >
                  Insights
                </Link>
                <Link
                  href="/profile"
                  className="px-3 py-2 text-gray-900 hover:text-gray-600"
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="ml-4 px-3 py-2 text-gray-900 hover:text-gray-600"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 text-gray-900 hover:text-gray-600"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-2 text-gray-900 hover:text-gray-600"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
