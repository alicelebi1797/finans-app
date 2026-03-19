import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { X, Plus, Pencil, Trash2, Check, Eye, EyeOff, ShieldCheck, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  id: number;
  username: string;
  displayName: string;
  isAdmin: boolean;
}

interface Props {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: Props) {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);

  const logoutMutation = useMutation({
    mutationFn: () => fetch('/api/auth/logout', { method: 'POST' }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] }),
  });
  const [editData, setEditData] = useState({ username: "", displayName: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createData, setCreateData] = useState({ username: "", displayName: "", password: "" });
  const [showCreatePw, setShowCreatePw] = useState(false);

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users'],
    queryFn: () => fetch('/api/admin/users', { credentials: 'include' }).then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof createData) =>
      fetch('/api/admin/users', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => { if (!r.ok) return r.json().then(e => Promise.reject(e)); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setCreateData({ username: "", displayName: "", password: "" });
      setShowCreateForm(false);
      toast({ title: "Kullanıcı oluşturuldu" });
    },
    onError: (e: any) => toast({ title: e?.message || "Hata", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof editData }) =>
      fetch(`/api/admin/users/${id}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => { if (!r.ok) return r.json().then(e => Promise.reject(e)); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setEditingId(null);
      toast({ title: "Güncellendi" });
    },
    onError: (e: any) => toast({ title: e?.message || "Hata", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/admin/users/${id}`, { method: 'DELETE', credentials: 'include' })
        .then(r => { if (!r.ok) return r.json().then(e => Promise.reject(e)); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Kullanıcı silindi" });
    },
    onError: (e: any) => toast({ title: e?.message || "Hata", variant: "destructive" }),
  });

  const startEdit = (u: AdminUser) => {
    setEditingId(u.id);
    setEditData({ username: u.username, displayName: u.displayName, password: "" });
    setShowPw(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-card/80">
          <h2 className="font-semibold text-base">Kullanıcı Yönetimi</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[70vh] p-5 space-y-3">
          {/* User list */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Yükleniyor...</div>
          ) : (
            users.map(u => (
              <div key={u.id} className="border border-border/50 rounded-xl overflow-hidden">
                {editingId === u.id ? (
                  <div className="p-4 space-y-3 bg-secondary/20">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Kullanıcı Adı</label>
                        <input
                          data-testid={`input-edit-username-${u.id}`}
                          value={editData.username}
                          onChange={e => setEditData(p => ({ ...p, username: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Görünen Ad</label>
                        <input
                          data-testid={`input-edit-displayname-${u.id}`}
                          value={editData.displayName}
                          onChange={e => setEditData(p => ({ ...p, displayName: e.target.value }))}
                          placeholder="Opsiyonel"
                          className="w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Yeni Şifre (boş bırakılırsa değişmez)</label>
                      <div className="relative">
                        <input
                          data-testid={`input-edit-password-${u.id}`}
                          type={showPw ? "text" : "password"}
                          value={editData.password}
                          onChange={e => setEditData(p => ({ ...p, password: e.target.value }))}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 pr-9 rounded-lg bg-background border border-border/60 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button onClick={() => setShowPw(v => !v)} className="absolute right-2.5 top-2.5 text-muted-foreground">
                          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        data-testid={`button-save-user-${u.id}`}
                        onClick={() => updateMutation.mutate({ id: u.id, data: editData })}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        <Check size={13} />Kaydet
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-primary">
                        {(u.displayName || u.username).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">{u.displayName || u.username}</span>
                        {u.isAdmin && <ShieldCheck size={13} className="text-primary flex-shrink-0" />}
                      </div>
                      <span className="text-xs text-muted-foreground">@{u.username}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        data-testid={`button-edit-user-${u.id}`}
                        onClick={() => startEdit(u)}
                        className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Pencil size={14} />
                      </button>
                      {!u.isAdmin && (
                        <button
                          data-testid={`button-delete-user-${u.id}`}
                          onClick={() => { if (confirm(`"${u.username}" kullanıcısı silinsin mi?`)) deleteMutation.mutate(u.id); }}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Create form */}
          {showCreateForm ? (
            <div className="border border-border/50 rounded-xl p-4 space-y-3 bg-secondary/10">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Yeni Kullanıcı</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Kullanıcı Adı *</label>
                  <input
                    data-testid="input-create-username"
                    value={createData.username}
                    onChange={e => setCreateData(p => ({ ...p, username: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Görünen Ad</label>
                  <input
                    data-testid="input-create-displayname"
                    value={createData.displayName}
                    onChange={e => setCreateData(p => ({ ...p, displayName: e.target.value }))}
                    placeholder="Opsiyonel"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Şifre *</label>
                <div className="relative">
                  <input
                    data-testid="input-create-password"
                    type={showCreatePw ? "text" : "password"}
                    value={createData.password}
                    onChange={e => setCreateData(p => ({ ...p, password: e.target.value }))}
                    className="w-full px-3 py-2 pr-9 rounded-lg bg-background border border-border/60 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button onClick={() => setShowCreatePw(v => !v)} className="absolute right-2.5 top-2.5 text-muted-foreground">
                    {showCreatePw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  data-testid="button-create-user"
                  onClick={() => createMutation.mutate(createData)}
                  disabled={createMutation.isPending || !createData.username || !createData.password}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Plus size={13} />Oluştur
                </button>
                <button
                  onClick={() => { setShowCreateForm(false); setCreateData({ username: "", displayName: "", password: "" }); }}
                  className="px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
                >
                  İptal
                </button>
              </div>
            </div>
          ) : (
            <button
              data-testid="button-show-create-user"
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border/60 text-muted-foreground text-sm hover:border-primary/50 hover:text-primary transition-colors"
            >
              <Plus size={16} />
              <span>Yeni Kullanıcı Ekle</span>
            </button>
          )}
        </div>

        {/* Mobile-only logout button */}
        <div className="md:hidden border-t border-border/50 px-5 py-4">
          <button
            data-testid="button-settings-logout"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            <LogOut size={16} />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </div>
    </div>
  );
}
