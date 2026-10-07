<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'

import SectionHeader from '../components/ui/SectionHeader.vue'

type OrderStatus = 'Paid' | 'Pending' | 'Refunded'

interface OrderRecord {
  id: string
  customer: string
  initials: string
  email: string
  date: string
  amount: number
  status: OrderStatus
}

const orderRecords: OrderRecord[] = [
  { id: '#PN-2481', customer: 'Olivia Carter', initials: 'OC', email: 'olivia@example.com', date: 'Jul 21, 2025', amount: 284, status: 'Paid' },
  { id: '#PN-2480', customer: 'Noah Williams', initials: 'NW', email: 'noah@example.com', date: 'Jul 21, 2025', amount: 890, status: 'Pending' },
  { id: '#PN-2479', customer: 'Emma Davis', initials: 'ED', email: 'emma@example.com', date: 'Jul 20, 2025', amount: 1240, status: 'Paid' },
  { id: '#PN-2478', customer: 'Liam Wilson', initials: 'LW', email: 'liam@example.com', date: 'Jul 20, 2025', amount: 156, status: 'Refunded' },
  { id: '#PN-2477', customer: 'Ava Thompson', initials: 'AT', email: 'ava@example.com', date: 'Jul 19, 2025', amount: 642, status: 'Paid' },
  { id: '#PN-2476', customer: 'James Anderson', initials: 'JA', email: 'james@example.com', date: 'Jul 19, 2025', amount: 318, status: 'Pending' },
]

const { smAndDown } = useDisplay()
const searchQuery = ref('')
const statusFilter = ref<'All' | OrderStatus>('All')

const visibleOrderRecords = computed(() => {
  const normalizedQuery = searchQuery.value.trim().toLowerCase()

  return orderRecords.filter((order) => {
    const matchesStatus = statusFilter.value === 'All' || order.status === statusFilter.value
    const matchesQuery = !normalizedQuery || `${order.id} ${order.customer} ${order.email}`.toLowerCase().includes(normalizedQuery)
    return matchesStatus && matchesQuery
  })
})

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function getStatusColor(status: OrderStatus): string {
  return status === 'Paid' ? 'success' : status === 'Pending' ? 'warning' : 'error'
}

function getStatusIcon(status: OrderStatus): string {
  return status === 'Paid' ? 'mdi-check-circle-outline' : status === 'Pending' ? 'mdi-clock-outline' : 'mdi-refresh-circle'
}
</script>

<template>
  <section class="page-view" aria-labelledby="orders-heading">
    <SectionHeader
      heading-id="orders-heading"
      eyebrow="Workspace / Orders"
      title="Orders"
      description="Keep every order moving in the right direction."
    >
      <template #action>
        <v-btn class="section-header__action" color="primary" prepend-icon="mdi-plus">New order</v-btn>
      </template>
    </SectionHeader>

    <v-card class="surface-card" variant="flat">
      <v-card-text>
        <div class="toolbar">
          <v-text-field
            v-model="searchQuery"
            aria-label="Search orders"
            class="toolbar__search"
            clearable
            hide-details
            placeholder="Search by customer or order ID"
            prepend-inner-icon="mdi-magnify"
          />
          <v-select
            v-model="statusFilter"
            aria-label="Filter orders by status"
            class="toolbar__filter"
            hide-details
            :items="['All', 'Paid', 'Pending', 'Refunded']"
            label="Status"
          />
          <v-btn aria-label="More order filters" class="toolbar__icon-button" icon="mdi-tune-variant" variant="tonal" />
        </div>

        <div class="table-summary" aria-live="polite">
          Showing {{ visibleOrderRecords.length }} of {{ orderRecords.length }} orders
        </div>

        <v-table v-if="!smAndDown" class="data-table" hover>
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Customer</th>
              <th scope="col">Date</th>
              <th scope="col">Amount</th>
              <th scope="col">Status</th>
              <th scope="col"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in visibleOrderRecords" :key="order.id">
              <td><span class="data-table__strong">{{ order.id }}</span></td>
              <td>
                <div class="identity-cell">
                  <v-avatar color="secondary" size="34">{{ order.initials }}</v-avatar>
                  <div><div class="data-table__strong">{{ order.customer }}</div><div class="data-table__muted">{{ order.email }}</div></div>
                </div>
              </td>
              <td>{{ order.date }}</td>
              <td><span class="data-table__strong">{{ formatCurrency(order.amount) }}</span></td>
              <td><v-chip :color="getStatusColor(order.status)" :prepend-icon="getStatusIcon(order.status)" size="small" variant="tonal">{{ order.status }}</v-chip></td>
              <td class="data-table__action"><v-btn aria-label="Open order" icon="mdi-arrow-up-right" size="small" variant="text" /></td>
            </tr>
          </tbody>
        </v-table>

        <div v-else class="mobile-list">
          <v-card v-for="order in visibleOrderRecords" :key="order.id" class="mobile-list__card" variant="outlined">
            <div class="mobile-list__topline"><span class="data-table__strong">{{ order.id }}</span><v-chip :color="getStatusColor(order.status)" size="small" variant="tonal">{{ order.status }}</v-chip></div>
            <div class="identity-cell"><v-avatar color="secondary" size="34">{{ order.initials }}</v-avatar><div><div class="data-table__strong">{{ order.customer }}</div><div class="data-table__muted">{{ order.email }}</div></div></div>
            <div class="mobile-list__details"><span>{{ order.date }}</span><span class="data-table__strong">{{ formatCurrency(order.amount) }}</span></div>
          </v-card>
        </div>

        <div v-if="visibleOrderRecords.length === 0" class="empty-state" role="status">
          <v-avatar color="surface-variant" size="52"><v-icon icon="mdi-magnify-close" /></v-avatar>
          <div class="empty-state__title">No orders found</div>
          <div class="empty-state__copy">Try a different search or clear the status filter.</div>
          <v-btn variant="tonal" @click="searchQuery = ''; statusFilter = 'All'">Clear filters</v-btn>
        </div>
      </v-card-text>
    </v-card>
  </section>
</template>
