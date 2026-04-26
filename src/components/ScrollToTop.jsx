// src/components/ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Route değiştiğinde sayfanın en üstüne git
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
