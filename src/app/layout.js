// import { Geist, Geist_Mono } from "next/font/google";
import { Theme } from "@radix-ui/themes";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "../styles/typography-custom.css";
// import "../styles/color-custom.css";
import "../styles/radix-custom.css";
import "../styles/fontIcons/style.css";
import WrapContexts from "@/provider/WrapContexts";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";


// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// Initialize the DM Sans font
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ["400", "500", "700"],
  variable: '--font-space-grotesk',
});

export const metadata = {
  title: "UT Vibe | Live Campus Map Feed",
  description:
    "UT Vibe — a real-time, map-based campus feed for spontaneous events, gatherings, and moments around you.",
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions)
  return (
    <html lang="en">


      <body className={`${dmSans.className} ${spaceGrotesk.variable}  antialiased`}>
        <WrapContexts session={session}>
          <Theme accentColor="blue" panelBackground="solid" radius="medium">
            {children}
          </Theme>
        </WrapContexts>
      </body>
    </html>
  );
}
