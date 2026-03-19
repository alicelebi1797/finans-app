import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useIbans() {
  return useQuery({
    queryKey: [api.ibans.list.path],
    queryFn: async () => {
      const res = await fetch(api.ibans.list.path);
      if (!res.ok) throw new Error("Failed to fetch IBANs");
      return api.ibans.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateIban() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.ibans.create.input>) => {
      const res = await fetch(api.ibans.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create IBAN");
      return api.ibans.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.ibans.list.path] }),
  });
}

export function useDeleteIban() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.ibans.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete IBAN");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.ibans.list.path] }),
  });
}
