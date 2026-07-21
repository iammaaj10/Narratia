"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      aria-label="Toggle Theme"
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`relative p-2.5 rounded-xl flex items-center justify-center transition-all duration-300 ${
        theme === "light"
          ? "bg-amber-500/10 border border-amber-500/30 text-amber-600 hover:bg-amber-500/20 shadow-sm"
          : "bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 shadow-sm"
      } ${className}`}
    >
      {theme === "light" ? (
        <Sun className="w-4 h-4 text-amber-500 transition-transform duration-300 rotate-0 scale-100" />
      ) : (
        <Moon className="w-4 h-4 text-purple-300 transition-transform duration-300 rotate-0 scale-100" />
      )}
    </motion.button>
  );
}
