import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import TransactionsView from '@/views/TransactionsView.vue'
import BudgetsView from '@/views/BudgetsView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: TransactionsView,
    },
    {
      path: '/budgets',
      name: 'budgets',
      component: BudgetsView,
    },
    {
      path: '/ai',
      redirect: '/',
    },
  ],
})

export default router
