import { Footer } from "@/components/share/Footer";
import { Navbar } from "@/components/share/Navbar";
import { BackToTop } from "@/components/share/BackToTop";

const layout = ({ children }) => {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <BackToTop />
    </>
  );
};

export default layout;
