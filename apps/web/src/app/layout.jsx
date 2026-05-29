import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata = {
  title: "transport-link Express",
  description: "Professional shipping, logistics, and estimated shipment tracking from transport-link Express.",
  icons: {
    icon: "/logo/Logo.png",
    shortcut: "/logo/Logo.png",
    apple: "/logo/Logo.png"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
