<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWorkspaceStore } from '@/stores/workspace'
import {
  LayoutDashboard,
  ArrowRightLeft,
  PieChart,
  Bot,
  ChevronDown,
  Building2,
  Wallet,
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const workspaceStore = useWorkspaceStore()
const dropdownOpen = ref(false)

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Transaksi', path: '/transactions', icon: ArrowRightLeft },
  { name: 'Pagu Anggaran & WA', path: '/budgets', icon: PieChart },
  { name: 'Asisten AI', path: '/ai', icon: Bot },
]

onMounted(() => {
  workspaceStore.fetchWorkspaces()
})

function selectWorkspace(id: string) {
  workspaceStore.setActiveWorkspace(id)
  dropdownOpen.value = false
}
</script>

<template>
  <div class="app-container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div style="padding: 24px 20px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid var(--color-border);">
        <div style="width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, #187aba, #003061); display: flex; align-items: center; justify-content: center; color: white;">
          <Wallet :size="20" />
        </div>
        <div>
          <h2 style="font-size: 16px; font-weight: 800; color: var(--color-navy); letter-spacing: -0.3px;">NexaFinance</h2>
          <span style="font-size: 11px; color: var(--color-primary); font-weight: 700; text-transform: uppercase;">Vue 3 Ultra-Light</span>
        </div>
      </div>

      <!-- Navigation -->
      <nav style="padding: 20px 14px; display: flex; flex-direction: column; gap: 6px; flex: 1;">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          style="display: flex; align-items: center; gap: 12px; padding: 11px 14px; border-radius: var(--radius-button); font-family: var(--font-heading); font-size: 13.5px; font-weight: 600; color: var(--color-text-secondary); transition: all 0.2s ease;"
          :style="route.path === item.path ? { background: 'rgba(24, 122, 186, 0.08)', color: 'var(--color-primary)', fontWeight: '700' } : {}"
        >
          <component :is="item.icon" :size="18" />
          <span>{{ item.name }}</span>
        </router-link>
      </nav>

      <!-- Bottom User Profile -->
      <div style="padding: 16px 20px; border-top: 1px solid var(--color-border); background: var(--color-bg-subtle);">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 34px; height: 34px; border-radius: 50%; background: #003061; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px;">
            IA
          </div>
          <div style="overflow: hidden;">
            <div style="font-size: 13px; font-weight: 700; color: var(--color-navy); white-space: nowrap; text-overflow: ellipsis;">Iman Azizi</div>
            <div style="font-size: 11px; color: var(--color-text-secondary); white-space: nowrap; text-overflow: ellipsis;">iman@nexafinance.com</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="main-content">
      <!-- Topbar -->
      <header class="topbar">
        <!-- Workspace Switcher -->
        <div style="position: relative;">
          <button
            type="button"
            @click="dropdownOpen = !dropdownOpen"
            class="btn btn-secondary btn-sm"
            style="border-radius: 10px; padding: 8px 14px; display: flex; align-items: center; gap: 8px;"
          >
            <Building2 :size="16" style="color: var(--color-primary);" />
            <span style="font-weight: 700;">{{ workspaceStore.activeWorkspace?.name || 'Pilih Workspace' }}</span>
            <ChevronDown :size="14" style="color: var(--color-text-muted);" />
          </button>

          <!-- Dropdown Menu -->
          <div
            v-if="dropdownOpen"
            style="position: absolute; top: calc(100% + 8px); left: 0; background: white; border: 1px solid var(--color-border-dark); border-radius: 12px; box-shadow: var(--shadow-mid); min-width: 240px; padding: 6px; z-index: 50;"
          >
            <div style="padding: 6px 10px; font-size: 11px; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase;">
              Workspace Aktif
            </div>
            <button
              v-for="ws in workspaceStore.workspaces"
              :key="ws.id"
              @click="selectWorkspace(ws.id)"
              style="width: 100%; text-align: left; padding: 9px 12px; border-radius: 8px; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: space-between; font-size: 13px;"
              :style="ws.id === workspaceStore.activeWorkspaceId ? { background: 'rgba(24, 122, 186, 0.08)', color: 'var(--color-primary)', fontWeight: '700' } : {}"
            >
              <span>{{ ws.name }}</span>
              <span class="badge" style="background: #f1f5f9; font-size: 10px;">{{ ws.type }}</span>
            </button>
          </div>
        </div>

        <!-- Right badges -->
        <div style="display: flex; align-items: center; gap: 12px;">
          <div class="badge" style="background: rgba(16, 135, 78, 0.1); color: #10874e; padding: 5px 10px;">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: #10874e; display: inline-block;"></span>
            <span>API Server Online</span>
          </div>
          <button class="btn btn-primary btn-sm" @click="router.push('/transactions')">
            <span>+ Catat Transaksi</span>
          </button>
        </div>
      </header>

      <!-- Page Body Slot -->
      <main class="page-body">
        <slot />
      </main>
    </div>
  </div>
</template>
