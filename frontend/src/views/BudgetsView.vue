<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useWorkspaceStore } from '@/stores/workspace'
import { Smartphone, Send } from 'lucide-vue-next'

const workspaceStore = useWorkspaceStore()
const budgets = ref<any[]>([])
const loading = ref(false)

// WhatsApp Simulator State
const simInput = ref('')
const simLoading = ref(false)
const simMessages = ref<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
  {
    sender: 'bot',
    text: '🤖 *NEXAFINANCE ASISTEN WHATSAPP*\nHalo! Kirim *menu* atau ketik transaksi Anda (contoh: _Makan siang 35rb bayar bca_ / _saldo_ / _ringkasan_).',
    time: 'Baru saja',
  },
])

async function fetchBudgets() {
  if (!workspaceStore.activeWorkspaceId) return
  loading.value = true
  try {
    const res = await fetch(`/api/workspaces/${workspaceStore.activeWorkspaceId}/budgets`)
    if (res.ok) {
      const data = await res.json()
      budgets.value = data.budgets || []
    }
  } catch (err) {
    console.error('Error fetching budgets:', err)
  } finally {
    loading.value = false
  }
}

watch(() => workspaceStore.activeWorkspaceId, () => {
  fetchBudgets()
})

onMounted(() => {
  fetchBudgets()
})

async function sendSimulatorMessage(preset?: string) {
  const textToSend = preset || simInput.value
  if (!textToSend.trim() || simLoading.value) return

  const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  simMessages.value.push({ sender: 'user', text: textToSend, time: now })
  simInput.value = ''
  simLoading.value = true

  try {
    const res = await fetch('/api/whatsapp/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: '087873861108', // Iman Azizi
        message: textToSend,
      }),
    })
    const data = await res.json()
    const replyText = data.replyPreview || data.error || 'Tidak ada respon.'
    simMessages.value.push({
      sender: 'bot',
      text: replyText,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    })

    if (data.actionTaken === 'TRANSACTION_CREATED') {
      await workspaceStore.fetchAccounts()
      await fetchBudgets()
    }
  } catch (err: any) {
    simMessages.value.push({ sender: 'bot', text: `❌ Error: ${err.message}`, time: now })
  } finally {
    simLoading.value = false
  }
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 24px;">
    <div>
      <h1 style="font-size: 24px; font-weight: 800; color: var(--color-navy); margin-bottom: 4px;">
        Pagu Anggaran & Integrasi WhatsApp
      </h1>
      <p style="color: var(--color-text-secondary); font-size: 14px;">
        Pantau batas belanja bulanan dan simulasi interaksi bot WhatsApp
      </p>
    </div>

    <div class="grid-2col">
      <!-- Left: Budgets List -->
      <div class="card">
        <h3 style="font-size: 16px; font-weight: 800; color: var(--color-navy); margin-bottom: 16px;">
          Daftar Pagu Anggaran Periode Ini
        </h3>

        <div v-if="budgets.length === 0" style="text-align: center; padding: 40px 20px; color: var(--color-text-muted);">
          Belum ada batas pagu anggaran untuk bulan ini.
        </div>

        <div v-else style="display: flex; flex-direction: column; gap: 16px;">
          <div
            v-for="b in budgets"
            :key="b.id"
            style="padding: 16px; border: 1px solid var(--color-border); border-radius: 12px; background: white;"
          >
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-weight: 700; color: var(--color-navy); font-size: 14px;">{{ b.categoryName }}</span>
              <span class="badge" :style="{ background: b.percentage >= 100 ? 'rgba(198,34,52,0.1)' : b.percentage >= 80 ? 'rgba(230,126,34,0.1)' : 'rgba(16,135,78,0.1)', color: b.percentage >= 100 ? 'var(--color-accent-red)' : b.percentage >= 80 ? '#e67e22' : 'var(--color-accent-green)' }">
                {{ b.percentage }}% Terpakai
              </span>
            </div>

            <!-- Progress Bar -->
            <div style="height: 7px; background: #f1f5f9; border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
              <div
                style="height: 100%; border-radius: 4px; transition: width 0.3s ease;"
                :style="{
                  width: `${Math.min(100, b.percentage)}%`,
                  background: b.percentage >= 100 ? 'var(--color-accent-red)' : b.percentage >= 80 ? '#e67e22' : 'var(--color-accent-green)'
                }"
              ></div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--color-text-secondary);">
              <span>Realisasi: {{ workspaceStore.formatRupiah(b.spent) }}</span>
              <span>Target: {{ workspaceStore.formatRupiah(b.amount) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Live WhatsApp Bot Simulator -->
      <div class="card" style="display: flex; flex-direction: column;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--color-border);">
          <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(16, 135, 78, 0.12); color: #10874e; display: flex; align-items: center; justify-content: center;">
            <Smartphone :size="16" />
          </div>
          <div>
            <h3 style="font-size: 15px; font-weight: 800; color: var(--color-navy);">WhatsApp Bot Simulator</h3>
            <span style="font-size: 11px; color: var(--color-text-secondary);">Langsung memproses webhook real-time</span>
          </div>
        </div>

        <!-- Chat bubble window -->
        <div style="flex: 1; min-height: 260px; max-height: 320px; overflow-y: auto; background: #f0f4f8; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px;">
          <div
            v-for="(msg, idx) in simMessages"
            :key="idx"
            :style="{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }"
          >
            <div
              :style="{
                background: msg.sender === 'user' ? '#d9fdd3' : '#ffffff',
                color: '#111b21',
                padding: '8px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                whiteSpace: 'pre-wrap',
                boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
              }"
            >
              {{ msg.text }}
            </div>
            <div style="font-size: 9px; color: var(--color-text-muted); text-align: right; margin-top: 2px;">{{ msg.time }}</div>
          </div>
        </div>

        <!-- Quick prompts chips -->
        <div style="display: flex; gap: 6px; overflow-x: auto; margin-bottom: 10px; padding-bottom: 4px;">
          <button
            v-for="chip in ['Makan siang padang 35rb bayar bca', 'saldo', 'ringkasan', 'menu']"
            :key="chip"
            type="button"
            class="badge"
            style="background: #f1f5f9; color: var(--color-navy); cursor: pointer; border: 1px solid var(--color-border-dark); font-size: 10.5px; padding: 4px 8px;"
            @click="sendSimulatorMessage(chip)"
          >
            {{ chip }}
          </button>
        </div>

        <!-- Input Bar -->
        <div style="display: flex; gap: 8px;">
          <input
            type="text"
            v-model="simInput"
            @keydown.enter="sendSimulatorMessage()"
            placeholder="Ketik transaksi / perintah bot..."
            class="form-input"
            style="min-height: 38px; font-size: 13px;"
          />
          <button class="btn btn-primary btn-sm" @click="sendSimulatorMessage()" :disabled="simLoading">
            <Send :size="13" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
