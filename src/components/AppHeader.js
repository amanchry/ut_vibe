"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { DropdownMenu, Separator } from "@radix-ui/themes";
import { signOut, useSession } from "next-auth/react";
import ProfileDropDown from "./ProfileDropDown";
import { User } from "lucide-react";

function AppHeader() {
  const { data: session } = useSession();
  const [userProfile, setUserProfile] = useState(null);

  const initial =
    userProfile?.firstName?.[0] ||
    session?.user?.name?.[0]?.toUpperCase() ||
    "U";

  return (
  <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur">
  <div className="h-14 px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition">
          <Image
            src="/images/Logo_horizontal.png"
            alt="UT Vibe"
            width={150}
            height={40}
            priority
            className="h-8 w-auto"
          />
        </Link>

        {/* Right: Profile */}
        <div className="flex items-center gap-2">
          <ProfileDropDown
            trigger={
              <button
                type="button"
                className={[
                  "h-9 w-9 rounded-full overflow-hidden grid place-items-center",
                  "ring-1 ring-black/10 hover:ring-black/20 transition",
                  userProfile?.profileImage ? "" : "bg-gray-900 text-white",
                ].join(" ")}
                aria-label="Open profile menu"
              >
                {userProfile?.profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={userProfile.profileImage}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold">{initial}</span>
                )}
              </button>
            }
          >
            <DropdownMenu.Item>
              <div className="flex flex-col items-center w-full py-1">
                <div
                  className={[
                    "h-16 w-16 rounded-full overflow-hidden grid place-items-center",
                    "ring-1 ring-black/10",
                    userProfile?.profileImage ? "" : "bg-gray-900 text-white",
                  ].join(" ")}
                >
                  {userProfile?.profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={userProfile.profileImage}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-semibold">{initial}</span>
                  )}
                </div>

                <div className="pt-3 text-center">
                  <div className="text-base font-semibold text-gray-900">
                    {userProfile?.firstName && userProfile?.lastName
                      ? `${userProfile.firstName} ${userProfile.lastName}`
                      : session?.user?.name || "User"}
                  </div>

                  {session?.user?.email && (
                    <div className="mt-0.5 text-xs text-gray-500">
                      {session.user.email}
                    </div>
                  )}
                </div>

                <div className="w-full mt-4">
                  <Separator size="4" />
                </div>

                <Link
                  href="/profile"
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition "
                >
                  <User className="h-4 w-4" />
                  <span>View Profile</span>
                </Link>

                <button
                  className="mt-3 inline-flex items-center justify-center rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:border-red-300 hover:text-red-700 transition"
                  onClick={() =>
                    signOut({ redirect: false }).then(() => {
                      window.location.href = `${process.env.NEXT_PUBLIC_URL}/auth/login`;
                    })
                  }
                >
                  Sign out
                </button>
              </div>
            </DropdownMenu.Item>
          </ProfileDropDown>
        </div>
      </div>

      {/* separator under AppHeader */}
      <div className="h-px bg-gray-200" />
    </header>
  );
}

export default AppHeader;
