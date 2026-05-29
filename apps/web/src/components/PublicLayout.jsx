import Footer from "./Footer";
import Header from "./Header";

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-white text-[#1F2937]">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
