<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useWorkspaceStore } from '@/stores/workspace'
import { Search, Trash2 } from 'lucide-vue-next'

const workspaceStore = useWorkspaceStore()
const transactions = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')
const typeFilter = ref('')

async function fetchTransactions() {
  if (!workspaceStore.activeWorkspaceId) return
  loading.value = true

  try {
    let url = `/api/workspaces/${workspaceStore.activeWorkspaceId}/transactions?limit=50`
    if (typeFilter.value) url += `&type=${typeFilter.value}`
    if (searchQuery.value) url += `&search=${encodeURIComponent(searchQuery.value)}`

    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      transactions.value = data.transactions || []
    }
  } catch (err) {
    console.error('Error fetching transactions:', err)
  } finally {
    loading.value = false
  }
}

watch([() => workspaceStore.activeWorkspaceId, typeFilter], () => {
  fetchTransactions()
})

onMounted(() => {
  fetchTransactions()
})

async function handleDelete(id: string) {
  if (!confirm('Hapus transaksi ini? Saldo rekening akan dikembalikan otomatis.')) return
  try {
    const res = await fetch(`/api/workspaces/${workspaceStore.activeWorkspaceId}/transactions/${id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      await workspaceStore.fetchAccounts()
      await fetchTransactions()
    }
  } catch (err: any) {
    alert(err.message)
  }
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 24px;">
    <div>
      <h1 style="font-size: 24px; font-weight: 800; color: var(--color-navy); margin-bottom: 4px;">
        Riwayat Transaksi Keuangan
      </h1>
      <p style="color: var(--color-text-secondary); font-size: 14px;">
        Mutasi pemasukan, pengeluaran, dan transfer dana terverifikasi
      </p>
    </div>

    <!-- Filters & Search Bar -->
    <div class="card" style="padding: 16px; display: flex; gap: 14px; align-items: center; flex-wrap: wrap;">
      <div style="flex: 1; min-width: 200px; display: flex; align-items: center; gap: 10px; background: var(--color-bg-subtle); padding: 8px 14px; border-radius: var(--radius-button); border: 1px solid var(--color-border-dark);">
        <Search :size="16" style="color: var(--color-text-muted);" />
        <input
          type="text"
          v-model="searchQuery"
          @input="fetchTransactions"
          placeholder="Cari transaksi berdasarkan keterangan..."
          style="border: none; background: transparent; outline: none; width: 100%; font-size: 14px;"
        />
      </div>

      <select v-model="typeFilter" class="form-select" style="width: auto; min-width: 160px; min-height: 40px; padding: 6px 12px;">
        <option value="">Semua Jenis Transaksi</option>
        <option value="EXPENSE">Pengeluaran</option>
        <option value="INCOME">Pemasukan</option>
        <option value="TRANSFER">Transfer Dana</option>
      </select>
    </div>

    <!-- Transaction Table -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
        <thead>
          <tr style="background: var(--color-bg-subtle); border-bottom: 1px solid var(--color-border); color: var(--color-text-secondary); font-size: 12px; font-weight: 700; text-transform: uppercase;">
            <th style="padding: 14px 20px;">Jenis</th>
            <th style="padding: 14px 20px;">Keterangan</th>
            <th style="padding: 14px 20px;">Rekening</th>
            <th style="padding: 14px 20px;">Kategori</th>
            <th style="padding: 14px 20px; text-align: right;">Nominal</th>
            <th style="padding: 14px 20px; text-align: center;">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="transactions.length === 0">
            <td colspan="6" style="text-align: center; padding: 40px; color: var(--color-text-muted);">
              Tidak ada data transaksi yang sesuai filter.
            </td>
          </tr>
          <tr
            v-for="tx in transactions"
            :key="tx.id"
            style="border-bottom: 1px solid var(--color-border); transition: background 0.15s ease;"
            @mouseenter="($event.currentTarget as HTMLElement).style.background = 'var(--color-surface-hover)'"
            @mouseleave="($event.currentTarget as HTMLElement).style.background = 'transparent'"
          >
            <td style="padding: 16px 20px;">
              <span
                class="badge"
                :class="tx.type === 'INCOME' ? 'badge-income' : tx.type === 'EXPENSE' ? 'badge-expense' : 'badge-transfer'"
              >
                {{ tx.type }}
              </span>
            </td>
            <td style="padding: 16px 20px; font-weight: 700; color: var(--color-navy);">
              {{ tx.description }}
            </td>
            <td style="padding: 16px 20px; color: var(--color-text-secondary);">
              {{ tx.account?.name }}
            </td>
            <td style="padding: 16px 20px; color: var(--color-text-secondary);">
              {{ tx.category?.name || '-' }}
            </td>
            <td
              style="padding: 16px 20px; text-align: right; font-weight: 800; font-family: var(--font-heading);"
              :style="{ color: tx.type === 'INCOME' ? 'var(--color-accent-green)' : 'var(--color-accent-red)' }"
            >
              {{ tx.type === 'INCOME' ? '+' : '-' }}{{ workspaceStore.formatRupiah(tx.amount) }}
            </td>
            <td style="padding: 16px 20px; text-align: center;">
              <button
                class="btn btn-secondary btn-sm"
                style="padding: 6px; border-radius: 6px; color: var(--color-accent-red);"
                @click="handleDelete(tx.id)"
                title="Hapus"
              >
                <Trash2 :size="14" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
