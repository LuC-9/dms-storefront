"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_OUT } from "@/lib/motion-presets";

type ProductImagePanelProps = {
  imageUrl: string;
  alt: string;
  inStock: boolean;
};

export function ProductImagePanel({ imageUrl, alt, inStock }: ProductImagePanelProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, ease: EASE_OUT }}
      className="card-surface overflow-hidden p-3 md:p-4"
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface-muted">
        <motion.div
          className="absolute inset-0"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src={imageUrl}
            alt={alt}
            fill
            className={`object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
            onLoad={() => setLoaded(true)}
          />
        </motion.div>
        <AnimatePresence>
          {loaded && (
            <motion.span
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${
                inStock ? "bg-safety-orange text-white" : "bg-iron-800 text-white"
              }`}
            >
              {inStock ? "In stock" : "Enquire"}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
