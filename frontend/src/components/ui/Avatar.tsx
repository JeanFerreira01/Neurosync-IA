import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  editable?: boolean;
}

const sizes = {
  xs: "w-7 h-7 text-xs",
  sm: "w-9 h-9 text-sm",
  md: "w-11 h-11 text-base",
  lg: "w-16 h-16 text-xl",
  xl: "w-24 h-24 text-3xl",
};

/* Gera uma cor consistente baseada no nome */
function nameToGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const gradients = [
    "from-violet-500 to-purple-700",
    "from-blue-500 to-indigo-700",
    "from-teal-500 to-cyan-700",
    "from-rose-500 to-pink-700",
    "from-amber-500 to-orange-700",
    "from-emerald-500 to-green-700",
    "from-fuchsia-500 to-pink-700",
    "from-sky-500 to-blue-700",
  ];
  return gradients[Math.abs(hash) % gradients.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, avatarUrl, size = "md", editable = false }: AvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const authStore = useAuthStore();

  const gradient = nameToGradient(name);
  const initials = getInitials(name || "U");
  const imgSrc = preview ?? avatarUrl ?? null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview imediato
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    try {
      const form = new FormData();
      form.append("avatar", file);
      const { data } = await api.patch("/auth/me/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Atualiza o store com o novo avatar
      authStore.user && Object.assign(authStore.user, { avatar: data.avatar });
    } catch {
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative inline-flex shrink-0">
      <div
        className={`${sizes[size]} rounded-full overflow-hidden flex items-center justify-center font-bold ring-2 ring-white/10 select-none ${imgSrc ? "" : `bg-gradient-to-br ${gradient}`}`}
      >
        {imgSrc ? (
          <img src={imgSrc} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-white drop-shadow">{initials}</span>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
            <Loader2 size={14} className="text-white animate-spin" />
          </div>
        )}
      </div>

      {editable && !uploading && (
        <button
          onClick={() => inputRef.current?.click()}
          className="absolute -bottom-0.5 -right-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-purple-600 hover:bg-purple-500 ring-2 ring-[rgb(var(--bg-deep))] transition-colors"
          title="Alterar foto"
        >
          <Camera size={10} className="text-white" />
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
