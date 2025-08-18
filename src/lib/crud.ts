import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";


export function createCrudHooks<TItem, TId = number>(cfg: {
  key: string; 
  list: (params?: any) => Promise<{ items?: TItem[] } | TItem[] | any>;
  getById: (id: TId) => Promise<TItem>;
  create: (payload: any) => Promise<any>;
  update: (id: TId, payload: any) => Promise<any>;
  remove: (id: TId) => Promise<any>;
}) {
  const useList = (params?: any) => {
    return useQuery({
      queryKey: [cfg.key, "list", params],
      queryFn: async () => {
        const res = await cfg.list(params);
        if (Array.isArray(res)) return res;
        if (res?.items) return res.items;
        return res?.data ?? [];
      }
    });
  };

  const useItem = (id: TId | null | undefined) => {
    return useQuery({
      queryKey: [cfg.key, "item", id],
      queryFn: () => {
        if (id == null) throw new Error("no id");
        return cfg.getById(id);
      },
      enabled: id != null,
    });
  };

  const useCreate = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (payload: any) => cfg.create(payload),
      onSuccess: () => qc.invalidateQueries({ queryKey: [cfg.key, "list"] }),
    });
  };

  const useUpdate = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, payload }: { id: TId, payload: any }) => cfg.update(id, payload),
      onSuccess: () => qc.invalidateQueries({ queryKey: [cfg.key] }),
    });
  };

  const useRemove = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id: TId) => cfg.remove(id),
      onSuccess: () => qc.invalidateQueries({ queryKey: [cfg.key, "list"] }),
    });
  };

  return { useList, useItem, useCreate, useUpdate, useRemove };
}
