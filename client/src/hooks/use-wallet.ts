import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useWalletAssets() {
  return useQuery({
    queryKey: [api.walletAssets.list.path],
    queryFn: async () => {
      const res = await fetch(api.walletAssets.list.path);
      if (!res.ok) throw new Error("Failed to fetch wallet assets");
      return api.walletAssets.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateWalletAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.walletAssets.create.input>) => {
      const res = await fetch(api.walletAssets.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create wallet asset");
      return api.walletAssets.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.walletAssets.list.path] }),
  });
}

export function useUpdateWalletAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<z.infer<typeof api.walletAssets.create.input>>) => {
      const url = buildUrl(api.walletAssets.update.path, { id });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update wallet asset");
      return api.walletAssets.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.walletAssets.list.path] }),
  });
}

export function useDeleteWalletAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.walletAssets.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete wallet asset");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.walletAssets.list.path] }),
  });
}
