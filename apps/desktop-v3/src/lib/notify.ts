import { toast } from "sonner";

export const notify = {
  error: (message: string) => toast.error(message, { duration: 5000 }),
  info: (message: string) => toast.info(message, { duration: 3000 }),
  success: (message: string) => toast.success(message, { duration: 3000 }),
  warning: (message: string) => toast.warning(message, { duration: 4000 }),
};
