import { AnimatePresence, motion } from "framer-motion";

export function CenterToast({
  open,
  title,
  message,
  onClose,
}: {
  open: boolean;
  title: string;
  message?: string;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            onClick={onClose}
            aria-label="Stäng"
            type="button"
          />

          <motion.div
            className="relative mx-4 w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-white/60 p-5"
            initial={{ y: 14, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-10 w-10 rounded-full bg-emerald-600/10 flex items-center justify-center">
                <span className="text-emerald-700 text-lg">✓</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{title}</p>
                {message && (
                  <p className="mt-1 text-sm text-gray-600">{message}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 transition"
                aria-label="Stäng toast"
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-gray-100">
              <motion.div
                className="h-full bg-emerald-600"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4.5, ease: "linear" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
