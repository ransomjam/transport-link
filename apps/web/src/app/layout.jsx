import "./globals.css";
import "leaflet/dist/leaflet.css";

const SITE_URL = "https://www.transport-link.com";
const SITE_NAME = "Transport Link";
const DEFAULT_TITLE = "Transport Link | Delivery and Shipment Tracking";
const DEFAULT_DESCRIPTION =
  "Transport Link provides professional goods delivery, shipment tracking, logistics support, and estimated route visibility for customers.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: "%s | Transport Link"
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: {
    canonical: "/"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    locale: "en_US",
    images: [
      {
        url: "/logo/Logo.png",
        alt: "Transport Link"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/logo/Logo.png"]
  },
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
