import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ScrollToTop } from "./ScrollToTop";
import { Chatbot } from "@/modules/chatbot/components/Chatbot";
import { ReferenceImageLauncher } from "@/modules/enquiry/components/ReferenceImageLauncher";

export function PublicLayout() {
  return (
    <>
      <ScrollToTop />
      {/* Every page is photography-first, so the first tab stop has to skip
          past a navigation bar that is identical on all of them. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory"
      >
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      {/* Website Notes, second drop. Public pages only — never /admin. */}
      <Chatbot />
      {/* Phase-3 feedback — stacked directly above the Sourcing Desk. */}
      <ReferenceImageLauncher />
    </>
  );
}
