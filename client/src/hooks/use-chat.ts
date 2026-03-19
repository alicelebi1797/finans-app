import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useChat() {
  return useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch(api.chat.message.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return api.chat.message.responses[200].parse(await res.json());
    },
  });
}
