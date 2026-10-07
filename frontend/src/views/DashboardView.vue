<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useWorkspaceStore } from '@/stores/workspace'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  PlusCircle,
  CheckCircle2,
} from 'lucide-vue-next'

const workspaceStore = useWorkspaceStore()

const summary = ref({
  totalIncome: 0,
  totalExpense: 0,
  netCashflow: 0,
})

const recentTransactions = ref<any[]>([])
const loading = ref(false)

// Modal state
const modalOpen = ref(false)
const txType = ref<'EXPENSE' | 'INCOME'>('EXPENSE')
const txAmount = ref('')
const txDesc = ref('')
const txAccount = ref('')
const txCategory = ref('')
const categories = ref<any[]>([])
const savingTx = ref(false)
const saveSuccess = ref(false)

async function fetchDashboardData() {
  if (!workspaceStore.activeWorkspaceId) return
  loading.value = true

  try {
    const wsId = workspaceStore.activeWorkspaceId
    // Fetch transactions
    const res = await fetch(`/api/workspaces/${wsId}/transactions?limit=6`)
    if (res.ok) {
      const data = await res.json()
      recentTransactions.value = data.transactions || []
      summary.value = data.summary || {
        totalIncome: 0,
        totalExpense: 0,
        netCashflow: 0,
      }
    }

    // Fetch categories
    const catRes = await fetch(`/api/workspaces/${wsId}/categories`)
    if (catRes.ok) {
      const catData = await catRes.json()
      categories.value = catData.categories || []
    }
  } catch (err) {
    console.error('Failed to fetch dashboard data:', err)
  } finally {
    loading.value = false
  }
}

watch(() => workspaceStore.activeWorkspaceId, () => {
  fetchDashboardData()
})

onMounted(() => {
  if (workspaceStore.activeWorkspaceId) {
    fetchDashboardData()
  }
})

async function handleCreateTransaction() {
  if (!workspaceStore.activeWorkspaceId || savingTx.value) return
  savingTx.value = true
  saveSuccess.value = false

  try {
    const res = await fetch(`/api/workspaces/${workspaceStore.activeWorkspaceId}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: txType.value,
        amount: parseInt(txAmount.value.replace(/\D/g, '') || '0', 10),
        description: txDesc.value,
        accountId: txAccount.value || workspaceStore.accounts[0]?.id,
        categoryId: txCategory.value || null,
      }),
    })

    if (!res.ok) throw new Error('Gagal menyimpan transaksi')

    saveSuccess.value = true
    setTimeout(() => {
      modalOpen.value = false
      saveSuccess.value = false
      txAmount.value = ''
      txDesc.value = ''
    }, 1200)

    // Refresh accounts & dashboard
    await workspaceStore.fetchAccounts()
    await fetchDashboardData()
  } catch (err: any) {
    alert(err.message || 'Terjadi kesalahan')
  } finally {
    savingTx.value = false
  }
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 28px;">
    <!-- Welcome Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px;">
      <div>
        <h1 style="font-size: 24px; font-weight: 800; color: var(--color-navy); margin-bottom: 4px;">
          Ringkasan Keuangan Eksekutif
        </h1>
        <p style="color: var(--color-text-secondary); font-size: 14px;">
          Workspace aktif: <strong style="color: var(--color-navy);">{{ workspaceStore.activeWorkspace?.name || '-' }}</strong>
        </p>
      </div>

      <button class="btn btn-primary" @click="modalOpen = true">
        <PlusCircle :size="16" />
        <span>Catat Transaksi Cepat</span>
      </button>
    </div>

    <!-- 4 KPI Metrics Grid -->
    <div class="grid-kpi">
      <!-- Total Saldo -->
      <div class="card" style="border-left: 4px solid var(--color-primary);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <span style="font-size: 12px; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase;">Total Likuiditas</span>
          <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(24, 122, 186, 0.1); display: flex; align-items: center; justify-content: center; color: var(--color-primary);">
            <Wallet :size="16" />
          </div>
        </div>
        <div style="font-size: 24px; font-weight: 800; color: var(--color-navy); font-family: var(--font-heading);">
          {{ workspaceStore.formatRupiah(workspaceStore.totalBalance) }}
        </div>
        <div style="font-size: 12px; color: var(--color-text-muted); margin-top: 6px;">
          Seluruh kas, bank, dan e-wallet aktif
        </div>
      </div>

      <!-- Pemasukan -->
      <div class="card" style="border-left: 4px solid var(--color-accent-green);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <span style="font-size: 12px; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase;">Pemasukan Bulan Ini</span>
          <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(16, 135, 78, 0.1); display: flex; align-items: center; justify-content: center; color: var(--color-accent-green);">
            <TrendingUp :size="16" />
          </div>
        </div>
        <div style="font-size: 24px; font-weight: 800; color: var(--color-accent-green); font-family: var(--font-heading);">
          {{ workspaceStore.formatRupiah(summary.totalIncome) }}
        </div>
        <div style="font-size: 12px; color: var(--color-text-muted); margin-top: 6px;">
          Arus dana masuk periode ini
        </div>
      </div>

      <!-- Pengeluaran -->
      <div class="card" style="border-left: 4px solid var(--color-accent-red);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <span style="font-size: 12px; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase;">Pengeluaran Bulan Ini</span>
          <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(198, 34, 52, 0.1); display: flex; align-items: center; justify-content: center; color: var(--color-accent-red);">
            <TrendingDown :size="16" />
          </div>
        </div>
        <div style="font-size: 24px; font-weight: 800; color: var(--color-accent-red); font-family: var(--font-heading);">
          {{ workspaceStore.formatRupiah(summary.totalExpense) }}
        </div>
        <div style="font-size: 12px; color: var(--color-text-muted); margin-top: 6px;">
          Total belanja & realisasi anggaran
        </div>
      </div>

      <!-- Net Cashflow -->
      <div class="card" style="border-left: 4px solid var(--color-navy);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <span style="font-size: 12px; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase;">Arus Kas Bersih (Net)</span>
          <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(0, 48, 97, 0.1); display: flex; align-items: center; justify-content: center; color: var(--color-navy);">
            <ArrowRightLeft :size="16" />
          </div>
        </div>
        <div style="font-size: 24px; font-weight: 800; color: var(--color-navy); font-family: var(--font-heading);">
          {{ workspaceStore.formatRupiah(summary.netCashflow) }}
        </div>
        <div style="font-size: 12px; color: var(--color-text-muted); margin-top: 6px;">
          Surplus / Defisit arus kas
        </div>
      </div>
    </div>

    <!-- Main Grid: Accounts List & Recent Transactions -->
    <div class="grid-2col">
      <!-- Recent Transactions -->
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h3 style="font-size: 16px; font-weight: 800; color: var(--color-navy);">Transaksi Terkini</h3>
            <span style="font-size: 12px; color: var(--color-text-secondary);">Mutasi keuangan terbaru di workspace</span>
          </div>
          <router-link to="/transactions" class="btn btn-secondary btn-sm">Lihat Semua</router-link>
        </div>

        <div v-if="recentTransactions.length === 0" style="text-align: center; padding: 40px 20px; color: var(--color-text-muted);">
          Belum ada catatan transaksi. Coba catat transaksi perdana Anda!
        </div>

        <div v-else style="display: flex; flex-direction: column; gap: 12px;">
          <div
            v-for="tx in recentTransactions"
            :key="tx.id"
            style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--color-surface-hover); border-radius: 12px;"
          >
            <div style="display: flex; align-items: center; gap: 12px;">
              <div
                class="badge"
                :class="tx.type === 'INCOME' ? 'badge-income' : tx.type === 'EXPENSE' ? 'badge-expense' : 'badge-transfer'"
                style="padding: 6px 10px;"
              >
                {{ tx.type }}
              </div>
              <div>
                <div style="font-weight: 700; font-size: 14px; color: var(--color-navy);">{{ tx.description }}</div>
                <div style="font-size: 12px; color: var(--color-text-muted);">
                  {{ tx.account?.name }} &bull; {{ tx.category?.name || 'Umum' }}
                </div>
              </div>
            </div>

            <div
              style="font-family: var(--font-heading); font-weight: 800; font-size: 15px;"
              :style="{ color: tx.type === 'INCOME' ? 'var(--color-accent-green)' : 'var(--color-accent-red)' }"
            >
              {{ tx.type === 'INCOME' ? '+' : '-' }}{{ workspaceStore.formatRupiah(tx.amount) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Account Balances -->
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h3 style="font-size: 16px; font-weight: 800; color: var(--color-navy);">Rekening & Kas</h3>
            <span style="font-size: 12px; color: var(--color-text-secondary);">Distribusi aset likuid</span>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div
            v-for="acc in workspaceStore.accounts"
            :key="acc.id"
            style="padding: 16px; border: 1px solid var(--color-border); border-radius: 14px; background: white; display: flex; justify-content: space-between; align-items: center;"
          >
            <div>
              <div style="font-weight: 700; font-size: 14.5px; color: var(--color-navy);">{{ acc.name }}</div>
              <span class="badge" style="background: #f1f5f9; color: var(--color-text-secondary); margin-top: 4px;">
                {{ acc.type }}
              </span>
            </div>
            <div style="font-family: var(--font-heading); font-weight: 800; font-size: 16px; color: var(--color-navy);">
              {{ workspaceStore.formatRupiah(acc.balance) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Catat Transaksi Cepat -->
    <div
      v-if="modalOpen"
      style="position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(4px);"
    >
      <div class="card" style="width: 100%; max-w: 480px; max-width: 480px; padding: 28px; box-shadow: var(--shadow-high);">
        <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 16px; color: var(--color-navy);">
          Catat Transaksi Baru
        </h3>

        <div v-if="saveSuccess" style="padding: 12px; background: rgba(16, 135, 78, 0.1); color: #10874e; border-radius: 8px; font-size: 13px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
          <CheckCircle2 :size="16" />
          <span>Transaksi berhasil dicatat dan saldo terpotong atomik!</span>
        </div>

        <form @submit.prevent="handleCreateTransaction" style="display: flex; flex-direction: column; gap: 16px;">
          <!-- Jenis -->
          <div style="display: flex; gap: 10px;">
            <button
              type="button"
              class="btn"
              :class="txType === 'EXPENSE' ? 'btn-primary' : 'btn-secondary'"
              style="flex: 1;"
              @click="txType = 'EXPENSE'"
            >
              Pengeluaran
            </button>
            <button
              type="button"
              class="btn"
              :class="txType === 'INCOME' ? 'btn-primary' : 'btn-secondary'"
              style="flex: 1;"
              @click="txType = 'INCOME'"
            >
              Pemasukan
            </button>
          </div>

          <!-- Nominal -->
          <div class="form-group">
            <label class="form-label">Nomor / Nominal (Rupiah)</label>
            <input
              type="text"
              v-model="txAmount"
              placeholder="Contoh: 50.000"
              class="form-input"
              required
            />
          </div>

          <!-- Keterangan -->
          <div class="form-group">
            <label class="form-label">Keterangan Transaksi</label>
            <input
              type="text"
              v-model="txDesc"
              placeholder="Contoh: Makan Siang Nasi Padang"
              class="form-input"
              required
            />
          </div>

          <!-- Rekening -->
          <div class="form-group">
            <label class="form-label">Rekening</label>
            <select v-model="txAccount" class="form-select" required>
              <option value="">Pilih Rekening</option>
              <option v-for="a in workspaceStore.accounts" :key="a.id" :value="a.id">
                {{ a.name }} ({{ workspaceStore.formatRupiah(a.balance) }})
              </option>
            </select>
          </div>

          <!-- Actions -->
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
            <button type="button" class="btn btn-secondary" @click="modalOpen = false">Batal</button>
            <button type="submit" class="btn btn-primary" :disabled="savingTx">
              {{ savingTx ? 'Menyimpan...' : 'Simpan Transaksi' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
