"use client";

type ToastOptions = {
  title: string;
  description?: string;
  variant?: "default" | "destructive" | string;
};

export function useToast() {
  const toast = ({ title, description, variant }: ToastOptions) => {
    if (typeof window !== "undefined") {
      // Minimal placeholder: replace with your UI toast system if needed
      console.log("toast:", { title, description, variant });
    }
  };

  return { toast };
}


