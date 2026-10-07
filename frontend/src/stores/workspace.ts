import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface FinancialAccount {
  id: string
  name: string
  type: string
  balance: number | string
  color: string
}

export interface Workspace {
  id: string
  name: string
  type: string
  currency: string
  role?: string
}

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspaces = ref<Workspace[]>([])
  const activeWorkspaceId = ref<string>('')
  const accounts = ref<FinancialAccount[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  const activeWorkspace = computed(() => {
    return workspaces.value.find((w) => w.id === activeWorkspaceId.value) || null
  })

  const totalBalance = computed(() => {
    return accounts.value.reduce((sum, acc) => sum + Number(acc.balance || 0), 0)
  })

  function formatRupiah(amount: number | string): string {
    const num = Number(amount || 0)
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }

  async function fetchWorkspaces() {
    loading.value = true
    error.value = null
    try {
      const res = await fetch('/api/workspaces')
      if (!res.ok) throw new Error('Gagal memuat workspace')
      const data = await res.json()
      workspaces.value = data.workspaces || []

      if (workspaces.value.length > 0 && !activeWorkspaceId.value) {
        activeWorkspaceId.value = workspaces.value[0].id
      }

      if (activeWorkspaceId.value) {
        await fetchAccounts()
      }
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function fetchAccounts() {
    if (!activeWorkspaceId.value) return
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId.value}/accounts`)
      if (res.ok) {
        const data = await res.json()
        accounts.value = data.accounts || []
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err)
    }
  }

  function setActiveWorkspace(id: string) {
    activeWorkspaceId.value = id
    fetchAccounts()
  }

  return {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    accounts,
    totalBalance,
    loading,
    error,
    formatRupiah,
    fetchWorkspaces,
    fetchAccounts,
    setActiveWorkspace,
  }
})
