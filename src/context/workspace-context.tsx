"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface WorkspaceAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  color: string;
}

export interface WorkspaceItem {
  id: string;
  name: string;
  type: "PERSONAL" | "BUSINESS";
  currency: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  accountsCount: number;
  totalBalance: number;
  accounts: WorkspaceAccount[];
  membersCount: number;
  transactionsCount: number;
  createdAt: string;
}

interface WorkspaceContextType {
  workspaces: WorkspaceItem[];
  activeWorkspace: WorkspaceItem | null;
  activeWorkspaceId: string | null;
  loading: boolean;
  setActiveWorkspaceId: (id: string) => void;
  refreshWorkspaces: () => Promise<void>;
  createWorkspace: (name: string, type: "PERSONAL" | "BUSINESS") => Promise<WorkspaceItem>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshWorkspaces = useCallback(async () => {
    try {
      const res = await fetch("/api/workspaces");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Gagal mengambil workspace");

      const data = await res.json();
      const list: WorkspaceItem[] = data.workspaces || [];
      setWorkspaces(list);

      // Determine active workspace
      const savedId = typeof window !== "undefined" ? localStorage.getItem("nexa_active_ws") : null;
      const matched = list.find((w) => w.id === savedId);

      if (matched) {
        setActiveWorkspaceIdState(matched.id);
      } else if (list.length > 0) {
        setActiveWorkspaceIdState(list[0].id);
        if (typeof window !== "undefined") {
          localStorage.setItem("nexa_active_ws", list[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading workspaces:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    refreshWorkspaces();
  }, [refreshWorkspaces]);

  const setActiveWorkspaceId = (id: string) => {
    setActiveWorkspaceIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("nexa_active_ws", id);
    }
  };

  const createWorkspace = async (name: string, type: "PERSONAL" | "BUSINESS") => {
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Gagal membuat workspace");
    }

    const data = await res.json();
    await refreshWorkspaces();
    setActiveWorkspaceId(data.workspace.id);
    return data.workspace;
  };

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || null;

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        activeWorkspaceId,
        loading,
        setActiveWorkspaceId,
        refreshWorkspaces,
        createWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
