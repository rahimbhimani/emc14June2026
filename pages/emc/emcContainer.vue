<template>
  <VContainer fluid class="pa-2 pa-sm-3 pa-md-4 pa-lg-8">
    <!-- HEADER -->
    <div
      class="d-flex flex-column flex-sm-row justify-space-between align-start align-sm-center mb-4 mb-md-6 gap-2 gap-md-4">
      <div class="flex-grow-1">
        <h1 class="text-h6 text-sm-h5 text-md-h4 font-weight-bold">
          Equipment Planning
        </h1>
        <div class="text-grey-darken-1 text-caption text-sm-body-2">
          Plan and manage your equipment and containers
        </div>
      </div>

      <!-- VIEW TOGGLE & REFRESH -->
      <div class="d-flex gap-2">
        <VBtnToggle v-model="viewMode" mandatory size="small">
          <VBtn value="card" icon="mdi:view-grid" title="Card view" />
          <VBtn value="list" icon="mdi:format-list-bulleted" title="List view" />
        </VBtnToggle>
        <VBtn icon="mdi:refresh" :loading="isLoading" @click="refreshData" size="small" />
      </div>
    </div>

    <!-- ACTION BAR (appears when config or container is selected) -->
    <VCard v-if="selectedConfig || viewingContainer" class="mb-4" elevation="4">
      <VCardText class="pa-3 pa-sm-4">
        <div class="d-flex align-center justify-space-between gap-3 flex-nowrap">
          <div class="d-flex align-center gap-3 min-width-0 flex-nowrap">
            <VBtn variant="text" icon="mdi:arrow-left" size="small"
              @click="selectedRelatedContainer ? (selectedRelatedContainer = null) : (viewingContainer ? (viewingContainer = null) : (selectedConfig = null))" />

            <div class="d-flex align-center gap-2 min-width-0 flex-nowrap">
              <div>
                <div class="text-h6 font-weight-bold text-truncate">
                  {{ (selectedRelatedContainers.size > 1
                    ? `${selectedRelatedContainers.size} selected`
                    : selectedRelatedContainer?.label) || viewingContainer?.label || selectedConfig?.label }}
                </div>
                <!-- Flight TypeData Display -->
                <div v-if="viewingContainer?.type === 'Flight'" class="mt-1">
                  <div v-if="viewingContainer?.typeData" class="text-caption text-body-2">
                    <span v-if="viewingContainer.typeData.flightNumber" class="font-weight-bold">{{
                      viewingContainer.typeData.flightNumber
                    }}</span>
                    <span v-if="viewingContainer.typeData.airline" class="ml-1">{{ viewingContainer.typeData.airline
                      }}</span>
                    <span v-if="viewingContainer.typeData.aircraft" class="ml-1">({{ viewingContainer.typeData.aircraft
                      }})</span>
                    <br v-if="viewingContainer.typeData.origin || viewingContainer.typeData.destination" />
                    <span v-if="viewingContainer.typeData.origin">{{ viewingContainer.typeData.origin }}</span>
                    <span v-if="viewingContainer.typeData.origin && viewingContainer.typeData.destination"
                      class="mx-1">→</span>
                    <span v-if="viewingContainer.typeData.destination">{{ viewingContainer.typeData.destination
                    }}</span>
                    <span v-if="viewingContainer.typeData.departureTime" class="ml-1">{{
                      viewingContainer.typeData.departureTime
                    }}</span>
                  </div>
                  <div v-else class="text-caption text-warning">
                    No flight details available
                  </div>
                </div>
              </div>
              <div v-if="(selectedConfig || viewingContainer) && !selectedRelatedContainer"
                class="text-caption text-grey flex-shrink-0">
                {{ visibleActions.length }} action(s) available
              </div>
            </div>
          </div>

          <div class="d-flex align-center gap-3 flex-nowrap">
            <!-- Dynamic Actions -->
            <div class="d-flex gap-2 flex-nowrap overflow-auto">
              <VBtn v-for="action in visibleActions" :key="action.id" size="medium" color="primary" variant="tonal"
                :prepend-icon="(action as any).icon" :disabled="!isActionEnabled(action)"
                :title="!isActionEnabled(action) ? getDisabledReason(action) : action.label"
                @click="handleAction(action)">
                {{ action.label }}
              </VBtn>
            </div>

            <!-- Actions Kebab Menu (all actions) -->
            <!-- {{ visibleActions }} -->
            <!-- {{ hiddenActions }} -->
            <!-- {{ selectedConfigMasterActions }}
            {{ allActions }} -->
            <VMenu v-if="allActions.length > 0">
              <template #activator="{ props }">
                <VBtn size="medium" variant="tonal" icon="mdi:dots-vertical" v-bind="props" />
              </template>
              <VList density="compact">
                <VListItem v-for="action in allActions" :key="action.id" :disabled="!isActionEnabled(action)"
                  @click="handleAction(action)">
                  <template #prepend>
                    <VIcon :icon="(action as any).icon" />
                  </template>
                  <VListItemTitle>{{ action.label }}</VListItemTitle>
                </VListItem>
              </VList>
            </VMenu>

            <!-- Utilities (only for containers) -->
            <div v-if="viewingContainer && !selectedRelatedContainer" class="d-flex gap-2 flex-nowrap">
              <VBtn size="medium" variant="outlined" @click="openAudit">
                <template #prepend>
                  <VIcon icon="mdi:history" />
                </template>
                Audit
              </VBtn>

              <VMenu>
                <template #activator="{ props }">
                  <VBtn size="medium" variant="outlined" v-bind="props">
                    <template #prepend>
                      <VIcon icon="mdi:download" />
                    </template>
                    Export
                  </VBtn>
                </template>
                <VList>
                  <VListItem @click="exportExcel">
                    <template #prepend>
                      <VIcon icon="mdi:file-excel" />
                    </template>
                    <VListItemTitle>Excel</VListItemTitle>
                  </VListItem>
                  <VListItem @click="exportCSV">
                    <template #prepend>
                      <VIcon icon="mdi:file-delimited" />
                    </template>
                    <VListItemTitle>CSV</VListItemTitle>
                  </VListItem>
                  <VListItem @click="exportPDF">
                    <template #prepend>
                      <VIcon icon="mdi:file-pdf" />
                    </template>
                    <VListItemTitle>PDF</VListItemTitle>
                  </VListItem>
                </VList>
              </VMenu>

              <VMenu>
                <template #activator="{ props }">
                  <VBtn size="medium" variant="outlined" v-bind="props">
                    <template #prepend>
                      <VIcon icon="mdi:upload" />
                    </template>
                    Import
                  </VBtn>
                </template>
                <VList>
                  <VListItem @click="importExcel">
                    <template #prepend>
                      <VIcon icon="mdi:file-excel" />
                    </template>
                    <VListItemTitle>Import Excel</VListItemTitle>
                  </VListItem>
                  <VListItem @click="importCSV">
                    <template #prepend>
                      <VIcon icon="mdi:file-delimited" />
                    </template>
                    <VListItemTitle>Import CSV</VListItemTitle>
                  </VListItem>
                </VList>
              </VMenu>
            </div>
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- LOADING STATE -->
    <VCard v-if="isLoading" class="mb-4">
      <VCardText class="text-center py-6 py-md-8">
        <VProgressCircular indeterminate color="primary" size="40" class="mb-4" />
        <div class="text-caption text-sm-body-2 text-medium-emphasis">Loading containers...</div>
      </VCardText>
    </VCard>

    <!-- ERROR STATE -->
    <VAlert v-if="error" type="error" variant="tonal" class="mb-4" closable @click:close="error = null">
      <div class="d-flex align-center justify-space-between">
        <div>
          <strong>Error:</strong> {{ error }}
        </div>
        <VBtn size="small" variant="text" @click="refreshData" class="ms-2">Retry</VBtn>
      </div>
    </VAlert>

    <!-- EMPTY STATE -->
    <VCard v-if="!isLoading && !error && containers.length === 0" class="mb-4">
      <VCardText class="text-center py-12">
        <VIcon size="64" class="mb-4 text-disabled">mdi:inbox-multiple</VIcon>
        <div class="text-h6 mb-2">No Containers Found</div>
        <div class="text-body-2 text-medium-emphasis mb-6">Try adjusting your filters or refresh the data</div>
        <VBtn color="primary" @click="refreshData">Refresh Data</VBtn>
      </VCardText>
    </VCard>

    <!-- CONTAINER CONFIGS SELECTION (when no config selected) -->
    <VCard v-if="!selectedConfig && !viewingContainer" class="mb-4">
      <VCardText class="pa-3 pa-sm-4 pa-md-6">
        <div class="text-subtitle-2 text-sm-subtitle-1 font-weight-bold mb-3 mb-md-4">Select Container Type</div>
        <VRow dense>
          <VCol v-for="config in availableConfigs" :key="config.id" cols="12" xs="6" sm="6" md="4" lg="3">
            <VCard class="airbnb-card h-100" elevation="4" @click="selectedConfig = config" hover>
              <VImg v-if="config.imageUrl" :src="config.imageUrl" height="160" cover
                class="rounded-top-xl config-image" />
              <VCardText class="pa-3 pa-md-4 d-flex flex-column">
                <div class="text-caption text-sm-subtitle-2 font-weight-bold mb-1 mb-md-2">
                  {{ config.label }}
                </div>
                <div class="text-caption text-grey mb-2 mb-md-3 flex-grow-1">
                  {{ config.description }}
                </div>
                <VChip size="x-small" variant="tonal">
                  {{ config.type }}
                </VChip>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- CONTAINERS LIST (when config selected) -->
    <VCard v-if="selectedConfig && !viewingContainer" class="mb-4">
      <!-- Header with back button -->
      <!-- Filter Bar -->
      <VCardText class="pa-2 pa-sm-3 pa-md-4">
        <VRow dense align="end">
          <VCol cols="12" sm="6" md="6">
            <VTextField v-model="searchQuery" label="Search" size="small" density="compact"
              prepend-inner-icon="mdi:magnify" clearable />
          </VCol>
          <VCol cols="12" sm="6" md="6">
            <VSelect v-model="filterByLifecycle" :items="['', 'DRAFT', 'READY', 'ACTIVE', 'CLOSED', 'ARCHIVED']"
              label="Status" size="small" density="compact" clearable>
              <template #item="{ item, props }">
                <v-list-item v-bind="props">
                  {{ item.value || 'All Statuses' }}
                </v-list-item>
              </template>
            </VSelect>
          </VCol>
        </VRow>
      </VCardText>

      <!-- CARD VIEW -->
      <VCardText v-if="viewMode === 'card'" class="pa-2 pa-sm-3 pa-md-4">
        <VRow dense>
          <!-- CONTAINERS CARD VIEW -->
          <VCol v-for="container in (selectedConfig?.type === 'Item' ? [] : filteredContainers)" :key="container.id"
            cols="12" xs="6" sm="6" md="4" lg="3">
            <VCard class="airbnb-card-container h-100 position-relative"
              :class="{ 'container-card-selected': isContainerCardSelected(container) }" elevation="3" hover
              @click="handleContainerCardClick(container)">
              <!-- Kebab Menu -->
              <div class="position-absolute" style="z-index: 10; inset-block-start: 8px; inset-inline-end: 8px;">
                <VMenu v-if="selectedConfigMasterActions.length > 0">
                  <template #activator="{ props }">
                    <VBtn icon="mdi:dots-vertical" size="x-small" variant="text" v-bind="props" @click.stop
                      title="More actions" />
                  </template>
                  <VList density="compact">
                    <VListItem v-for="action in selectedConfigMasterActions" :key="action?.id"
                      @click.stop="handleAction(action)">
                      <template #prepend>
                        <VIcon :icon="action?.icon || 'mdi:play'" />
                      </template>
                      <VListItemTitle>{{ action?.label }}</VListItemTitle>
                    </VListItem>
                  </VList>
                </VMenu>
              </div>

              <!-- Image/Icon Display -->
              <div class="d-flex justify-center align-center pa-4 bg-grey-lighten-3" style="min-block-size: 120px;">
                <!-- Show Image if available -->
                <VImg v-if="selectedConfig?.imageUrl" :src="selectedConfig.imageUrl" height="100" contain
                  class="rounded-lg" />
                <!-- Otherwise show MDI icon -->
                <VIcon v-else-if="selectedConfig?.icon" :icon="selectedConfig.icon" size="48" color="grey-darken-2" />
                <!-- Default fallback icon -->
                <VIcon v-else icon="mdi:package" size="48" color="grey-darken-2" />
              </div>

              <VCardText class="pa-2 pa-md-3 d-flex flex-column">
                <div class="d-flex justify-space-between align-start mb-1 mb-md-2 gap-1">
                  <div class="min-width-0 flex-grow-1 pr-2">
                    <div class="text-caption text-sm-subtitle-2 font-weight-bold text-truncate">
                      {{ container.label }}
                    </div>
                    <!-- Flight TypeData in Card -->
                    <div v-if="container.type === 'Flight' && container.typeData"
                      class="text-caption text-grey text-truncate">
                      <span v-if="container.typeData.flightNumber">{{ container.typeData.flightNumber }}</span>
                      <span v-if="container.typeData.origin"> ({{ container.typeData.origin }}→{{
                        container.typeData.destination }})</span>
                    </div>
                    <div v-else class="text-caption text-grey text-truncate">
                      {{ container.id }}
                    </div>
                  </div>
                  <VChip size="x-small" :color="getLifecycleColor(container.lifecycle)" class="flex-shrink-0">
                    {{ container.lifecycle }}
                  </VChip>
                </div>

                <div class="d-flex gap-1 mb-1 mb-md-2 flex-wrap">
                  <VChip size="x-small" variant="outlined">
                    {{ container.category }}
                  </VChip>
                </div>

                <div v-if="container.description" class="text-caption text-grey text-truncate flex-grow-1">
                  {{ container.description }}
                </div>
              </VCardText>
            </VCard>
          </VCol>

          <!-- ITEMS CARD VIEW -->
          <VCol v-for="item in (selectedConfig?.type === 'Item' ? filteredItems : [])" :key="item._id || item.id"
            cols="12" xs="6" sm="6" md="4" lg="3">
            <VCard class="airbnb-card-container h-100 position-relative" elevation="3" hover>
              <!-- Image Display -->
              <div class="d-flex justify-center align-center pa-4 bg-grey-lighten-3" style="min-block-size: 120px;">
                <VImg v-if="item.image" :src="item.image" height="100" contain class="rounded-lg" />
                <VIcon v-else icon="mdi:package-variant" size="48" color="grey-darken-2" />
              </div>

              <VCardText class="pa-2 pa-md-3 d-flex flex-column">
                <div class="d-flex justify-space-between align-start mb-1 mb-md-2 gap-1">
                  <div class="min-width-0 flex-grow-1 pr-2">
                    <div class="text-caption text-sm-subtitle-2 font-weight-bold text-truncate">
                      {{ item.name || item.label }}
                    </div>
                    <div class="text-caption text-grey text-truncate">
                      {{ item._id || item.id }}
                    </div>
                  </div>
                </div>

                <div class="d-flex gap-1 mb-1 mb-md-2 flex-wrap">
                  <VChip v-if="item.category" size="x-small" variant="outlined">
                    {{ item.category }}
                  </VChip>
                </div>

                <div v-if="item.description" class="text-caption text-grey text-truncate flex-grow-1">
                  {{ item.description }}
                </div>

                <div v-if="item.currentStock !== undefined" class="mt-2">
                  <VChip size="x-small" variant="tonal" color="info">
                    Stock: {{ item.currentStock }}
                  </VChip>
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VCardText>
      <!-- TABLE VIEW (hidden on mobile, shown on sm+) -->
      <!-- CONTAINERS TABLE -->
      <VTable v-if="viewMode === 'list' && selectedConfig?.type !== 'Item'" class="hidden-xs" density="compact">
        <thead>
          <tr>
            <th class="text-left text-caption">Label</th>
            <th class="text-left text-caption">ID</th>
            <th class="text-left text-caption">Category</th>
            <th class="text-left text-caption">Status</th>
            <th class="text-left text-caption">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="container in filteredContainers" :key="container.id" class="cursor-pointer"
            @click="handleContainerCardClick(container)">
            <td class="text-caption">{{ container.label }}</td>
            <td>
              <code class="text-caption" v-if="container.type === 'Flight' && container.typeData">
            {{ container.typeData.flightNumber || container.id }}
          </code>
              <code class="text-caption" v-else>{{ container.id }}</code>
            </td>
            <td class="text-caption">{{ container.category }}</td>
            <td>
              <VChip size="x-small" :color="getLifecycleColor(container.lifecycle)">
                {{ container.lifecycle }}
              </VChip>
            </td>
            <td>
              <VMenu v-if="selectedConfigMasterActions.length > 0">
                <template #activator="{ props }">
                  <VBtn icon="mdi:dots-vertical" size="x-small" variant="text" v-bind="props" @click.stop />
                </template>
                <VList density="compact">
                  <VListItem v-for="action in selectedConfigMasterActions" :key="action?.id"
                    @click.stop="handleAction(action)">
                    <template #prepend>
                      <VIcon :icon="action?.icon || 'mdi:play'" />
                    </template>
                    <VListItemTitle>{{ action?.label }}</VListItemTitle>
                  </VListItem>
                </VList>
              </VMenu>
            </td>
          </tr>
        </tbody>
      </VTable>

      <!-- ITEMS TABLE -->
      <VTable v-if="viewMode === 'list' && selectedConfig?.type === 'Item'" class="hidden-xs" density="compact">
        <thead>
          <tr>
            <th class="text-left text-caption">Name</th>
            <th class="text-left text-caption">ID/SKU</th>
            <th class="text-left text-caption">Category</th>
            <th class="text-left text-caption">Stock</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredItems" :key="item._id || item.id" class="cursor-pointer">
            <td class="text-caption">{{ item.name || item.label }}</td>
            <td>
              <code class="text-caption">{{ item._id || item.id }}</code>
            </td>
            <td class="text-caption">{{ item.category || '—' }}</td>
            <td class="text-caption">{{ item.currentStock !== undefined ? item.currentStock : '—' }}</td>
          </tr>
        </tbody>
      </VTable>

      <!-- MOBILE TABLE VIEW (card layout fallback for mobile) -->
      <VCard v-if="viewMode === 'list'" class="hidden-sm-and-up">
        <VCardText class="pa-2">
          <VRow dense>
            <!-- CONTAINERS MOBILE VIEW -->
            <VCol v-for="container in (selectedConfig?.type === 'Item' ? [] : filteredContainers)" :key="container.id"
              cols="12">
              <VCard class="pa-2" :class="{ 'container-card-selected': isContainerCardSelected(container) }"
                variant="outlined" hover @click="handleContainerCardClick(container)">
                <div class="d-flex justify-space-between align-start mb-2">
                  <div class="flex-grow-1">
                    <div class="text-caption font-weight-bold">{{ container.label }}</div>
                    <div v-if="container.type === 'Flight' && container.typeData" class="text-caption text-grey">
                      <span v-if="container.typeData.flightNumber">{{ container.typeData.flightNumber }}</span>
                      <span v-if="container.typeData.origin"> • {{ container.typeData.origin }}→{{
                        container.typeData.destination }}</span>
                    </div>
                    <div v-else class="text-caption text-grey">{{ container.id }}</div>
                  </div>
                  <VMenu v-if="selectedConfigMasterActions.length > 0">
                    <template #activator="{ props }">
                      <VBtn icon="mdi:dots-vertical" size="x-small" variant="text" v-bind="props" @click.stop />
                    </template>
                    <VList density="compact">
                      <VListItem v-for="action in selectedConfigMasterActions" :key="action?.id"
                        @click.stop="handleAction(action)">
                        <template #prepend>
                          <VIcon :icon="action?.icon || 'mdi:play'" />
                        </template>
                        <VListItemTitle>{{ action?.label }}</VListItemTitle>
                      </VListItem>
                    </VList>
                  </VMenu>
                </div>
                <VChip size="x-small" :color="getLifecycleColor(container.lifecycle)">
                  {{ container.lifecycle }}
                </VChip>
              </VCard>
            </VCol>

            <!-- ITEMS MOBILE VIEW -->
            <VCol v-for="item in (selectedConfig?.type === 'Item' ? filteredItems : [])" :key="item._id || item.id"
              cols="12">
              <VCard class="pa-2" variant="outlined" hover>
                <div class="d-flex justify-space-between align-start">
                  <div class="flex-grow-1">
                    <div class="text-caption font-weight-bold">{{ item.name || item.label }}</div>
                    <div class="text-caption text-grey">{{ item._id || item.id }}</div>
                    <div v-if="item.category" class="text-caption text-grey mt-1">
                      {{ item.category }}
                    </div>
                    <div v-if="item.currentStock !== undefined" class="text-caption text-grey mt-1">
                      Stock: {{ item.currentStock }}
                    </div>
                  </div>
                </div>
              </VCard>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCard>

    <!-- SPLIT PANEL (viewing container - desktop: 3-9 cols, mobile: stacked) -->
    <div v-if="viewingContainer && !selectedRelatedContainer" class="mt-4 mt-md-6">
      <VRow no-gutters>
        <!-- LEFT PANEL: Container Details (hidden on mobile, shown on md+) -->
        <VCol cols="12" md="4" lg="3" class="pr-2 hidden-md-and-down">
          <VCard class="pa-3 pa-md-4" elevation="2" style="max-block-size: 80vh; overflow-y: auto;">
            <div class="text-caption text-grey font-weight-bold mb-2">
              Container ID
            </div>
            <div class="text-body-2 font-weight-bold mb-3">
              {{ viewingContainer.id }}
            </div>

            <VChip :color="getLifecycleColor(viewingContainer.lifecycle)" variant="tonal" class="mb-3">
              {{ viewingContainer.lifecycle }}
            </VChip>

            <VDivider class="my-3" />

            <div class="text-caption text-grey font-weight-bold mb-2">
              Details
            </div>

            <div class="text-caption mb-1">
              <strong>Type:</strong> {{ viewingContainer.type }}
            </div>

            <div class="text-caption mb-1">
              <strong>isLeafContainer:</strong> {{ isLeafContainer }}
            </div>

            <div class="text-caption mb-1">
              <strong>canContain:</strong> {{ currentContainerConfig?.canContain || '[]' }}
            </div>

            <div class="text-caption mb-1">
              <strong>Category:</strong> {{ viewingContainer.category }}
            </div>

            <div v-if="viewingContainer.description" class="text-caption mb-2">
              <strong>Desc:</strong>
              <div class="text-caption text-grey mt-1">
                {{ viewingContainer.description }}
              </div>
            </div>

            <div v-if="viewingContainer.specialHandlingNotes" class="text-caption mb-2">
              <strong>Notes:</strong>
              <div class="text-caption text-warning mt-1">
                {{ viewingContainer.specialHandlingNotes }}
              </div>
            </div>

            <VDivider class="my-3" />

            <!-- Type-specific Data -->
            <div v-if="viewingContainer.typeData" class="mb-2">
              <div class="text-caption text-grey font-weight-bold mb-1">
                Specs
              </div>
              <div class="text-caption">
                <div v-for="(value, key) in flattenTypeData(viewingContainer.typeData)" :key="key" class="mb-1">
                  <strong>{{ formatLabel(key) }}:</strong> {{ formatValue(value) }}
                </div>
              </div>
            </div>

            <div class="mt-3" v-if="viewingContainerActions.length > 0">
              <div class="text-caption text-grey font-weight-bold mb-1">
                Actions
              </div>
              <VList density="compact" class="pa-0">
                <VListItem v-for="action in viewingContainerActions" :key="action.id" class="px-0">
                  <template #prepend>
                    <VIcon :icon="action.icon || 'mdi:play'" size="16" />
                  </template>
                  <VListItemTitle class="text-caption">{{ action.label }}</VListItemTitle>
                </VListItem>
              </VList>
            </div>
          </VCard>
        </VCol>

        <!-- RIGHT PANEL: Related Containers (full width on mobile, 8-9 cols on desktop) -->
        <VCol cols="12" md="8" lg="9" class="pl-1">
          <VCard elevation="2" class="fill-height">
            <!-- Header with Title -->

            <VCardText class="pb-0 pa-3 pa-md-4">
              <div class="d-flex flex-column flex-md-row justify-md-space-between align-md-start gap-2 gap-md-3">
                <div class="min-width-0">
                  <h2 class="text-h6 text-md-h5 font-weight-bold mb-1 mb-md-2 text-wrap">
                    {{ viewingContainer.label }}
                  </h2>
                  <div class="text-caption text-sm-body-2 text-grey text-wrap">
                    {{ isLeafContainer ? 'Current container and movement history' : 'Containers that can be attached' }}
                  </div>
                </div>
              </div>
              <VTabs v-if="!isLeafContainer" v-model="planningTab" density="compact" class="mt-3">
                <VTab value="planning">
                  Available ({{ viewingContainer?.type === 'Trolley' ? availableWarehouseItems.length :
                    viewingContainer?.type === 'Flight' ? availableTrolleys.length :
                      planningContainers.length }})
                </VTab>
                <VTab value="planned">

                  Planned ({{ plannedContainers.length }})
                </VTab>
              </VTabs>
            </VCardText>

            <VDivider />

            <template v-if="isLeafContainer">
              <VCardText class="pa-3 pa-md-4">
                <div class="text-subtitle-2 font-weight-bold mb-3">Current Container</div>
                <VCard variant="outlined" class="mb-4">
                  <VCardText class="pa-3">
                    <div class="d-flex justify-space-between align-start gap-2">
                      <div>
                        <div class="text-caption font-weight-bold">{{ viewingContainer.label }}</div>
                        <div class="text-caption text-grey">{{ viewingContainer.id }}</div>
                        <div class="text-caption text-grey">Type: {{ viewingContainer.type }}</div>
                      </div>
                      <VChip size="x-small" :color="getLifecycleColor(viewingContainer.lifecycle)">
                        {{ viewingContainer.lifecycle }}
                      </VChip>
                    </div>
                  </VCardText>
                </VCard>

                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="text-subtitle-2 font-weight-bold">History</div>
                  <VProgressCircular v-if="historyLoading" indeterminate size="18" width="2" color="primary" />
                </div>

                <VCard v-if="!historyLoading && movementHistory.length === 0" variant="outlined">
                  <VCardText class="text-caption text-medium-emphasis">
                    No movement history found for this container.
                  </VCardText>
                </VCard>

                <VTimeline v-else density="compact" side="end" truncate-line="both">
                  <VTimelineItem v-for="item in movementHistory" :key="item._id" size="x-small" dot-color="primary">
                    <div class="text-caption font-weight-bold">{{ item.actionLabel || item.movementType }}</div>
                    <div class="text-caption text-grey">
                      {{ item.parentContainerId }} → {{ item.childContainerId }}
                    </div>
                    <div class="text-caption text-grey">
                      {{ item.fromStatus || 'N/A' }} → {{ item.toStatus }}
                    </div>
                    <div class="text-caption text-grey">
                      By: {{ item.movedByName || 'Unknown User' }} ({{ item.movedByCode || item.movedBy || 'N/A' }})
                    </div>
                    <div class="text-caption text-grey">
                      {{ formatDateTime(item.movedAt || item.createdAt) }}
                    </div>
                  </VTimelineItem>
                </VTimeline>
              </VCardText>
            </template>

            <template v-else>
              <!-- SHOW ASSOCIATED ITEMS SECTION -->
              <!-- <VCardText v-if="plannedContainers.length > 0" class="pa-3 pa-md-4 border-bottom">
                <div class="text-subtitle-2 font-weight-bold mb-3">📦 Items in {{ viewingContainer?.label }}</div>
                <VList density="compact">
                  <VListItem v-for="item in plannedContainers" :key="item.id">
                    <template #prepend>
                      <VIcon icon="mdi:package" />
                    </template>
        <VListItemTitle class="text-caption">
          {{ item.label }} ({{ item.id }})
        </VListItemTitle>
        <template #append>
                      <div class="text-caption text-grey font-weight-bold">
                        {{ associatedItemQuantities.get(item.id) || 0 }} units
                      </div>
                    </template>
        </VListItem>
        </VList>
        </VCardText> -->

              <!-- <VDivider /> -->

            </template>

            <VWindow v-if="!isLeafContainer" v-model="planningTab">
              <VWindowItem value="planning">
                <!-- Warehouse Items for Trolley Loading (at top of planning tab) -->
                <VCardText v-if="viewingContainer?.type === 'Trolley'" class="pa-3 pa-md-4 pb-2">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <div class="text-subtitle-2 font-weight-bold">Load from Warehouse</div>
                    <div v-if="selectedWarehouseItems.size > 0" class="d-flex align-center gap-2">
                      <VChip size="small" color="primary" variant="tonal">{{ selectedWarehouseItems.size }} selected
                      </VChip>
                      <VBtn size="x-small" icon="mdi:close" variant="text" @click="clearWarehouseItemSelection()" />
                    </div>
                  </div>
                  <div v-if="warehouseItemsLoading" class="text-center py-4">
                    <VProgressCircular indeterminate size="24" width="2" color="primary" />
                    <div class="text-caption mt-2">Loading warehouse items...</div>
                  </div>
                  <div v-else-if="availableWarehouseItems.length === 0" class="text-center py-4">
                    <VIcon size="40" class="mb-2 text-disabled">mdi:warehouse</VIcon>
                    <div class="text-body-2 text-medium-emphasis">No warehouse items available</div>
                  </div>
                  <div v-else>
                    <!-- CARD VIEW FOR WAREHOUSE ITEMS -->
                    <div v-if="viewMode === 'card'" class="mb-3">
                      <VRow dense>
                        <VCol v-for="item in availableWarehouseItems" :key="`${item.warehouseId}-${item.itemId}`"
                          cols="12" xs="6" sm="6" md="4" lg="3">
                          <VCard :class="{ 'container-card-selected': isWarehouseItemSelected(item) }"
                            :outlined="!isWarehouseItemSelected(item)" elevation="1" hover class="h-100">
                            <!-- Checkbox -->
                            <div class="position-absolute"
                              style="z-index: 1; inset-block-start: 8px; inset-inline-start: 8px;">
                              <VCheckbox :model-value="isWarehouseItemSelected(item)" density="compact" @click.stop
                                @update:model-value="toggleSelectWarehouseItem(item)" />
                            </div>

                            <!-- Kebab Menu -->
                            <div class="position-absolute"
                              style="z-index: 1; inset-block-start: 8px; inset-inline-end: 8px;">
                              <VMenu>
                                <template #activator="{ props }">
                                  <VBtn icon="mdi:dots-vertical" size="x-small" variant="text" v-bind="props"
                                    @click.stop />
                                </template>
                                <VList density="compact">
                                  <VListItem @click.stop="showTrolleyLoadDialog(item)">
                                    <template #prepend>
                                      <VIcon icon="mdi:plus" />
                                    </template>
                                    <VListItemTitle>Load Item</VListItemTitle>
                                  </VListItem>
                                  <VListItem v-if="isWarehouseItemSelected(item)"
                                    @click.stop="toggleSelectWarehouseItem(item)">
                                    <template #prepend>
                                      <VIcon icon="mdi:close" />
                                    </template>
                                    <VListItemTitle>Deselect</VListItemTitle>
                                  </VListItem>
                                </VList>
                              </VMenu>
                            </div>

                            <VCardText class="pa-3 ps-12">
                              <div class="text-subtitle-2 font-weight-bold mb-1">{{ item.itemLabel }}</div>
                              <div class="text-caption text-grey mb-2">{{ item.warehouseLabel }}</div>
                              <VChip size="x-small" variant="tonal" color="info">
                                {{ item.quantityOnHand }} units
                              </VChip>
                            </VCardText>
                          </VCard>
                        </VCol>
                      </VRow>
                    </div>

                    <!-- LIST VIEW FOR WAREHOUSE ITEMS -->
                    <div v-else>
                      <VList density="compact" class="pa-0 border rounded">
                        <VListItem v-for="item in availableWarehouseItems" :key="`${item.warehouseId}-${item.itemId}`"
                          :class="{ 'bg-blue-lighten-5': isWarehouseItemSelected(item) }" class="py-2 px-3">
                          <template #prepend>
                            <VCheckbox :model-value="isWarehouseItemSelected(item)" density="compact" @click.stop
                              @update:model-value="toggleSelectWarehouseItem(item)" />
                          </template>

                          <VListItemTitle class="text-subtitle-2 font-weight-bold">{{ item.itemLabel }}</VListItemTitle>
                          <VListItemSubtitle class="text-caption">{{ item.warehouseLabel }}</VListItemSubtitle>

                          <template #append>
                            <div class="d-flex align-center gap-2">
                              <VChip size="small" variant="tonal" color="info">{{ item.quantityOnHand }} units</VChip>
                              <VMenu>
                                <template #activator="{ props }">
                                  <VBtn icon="mdi:dots-vertical" size="x-small" variant="text" v-bind="props"
                                    @click.stop />
                                </template>
                                <VList density="compact">
                                  <VListItem @click.stop="showTrolleyLoadDialog(item)">
                                    <template #prepend>
                                      <VIcon icon="mdi:plus" />
                                    </template>
                                    <VListItemTitle>Load Item</VListItemTitle>
                                  </VListItem>
                                  <VListItem v-if="isWarehouseItemSelected(item)"
                                    @click.stop="toggleSelectWarehouseItem(item)">
                                    <template #prepend>
                                      <VIcon icon="mdi:close" />
                                    </template>
                                    <VListItemTitle>Deselect</VListItemTitle>
                                  </VListItem>
                                </VList>
                              </VMenu>
                            </div>
                          </template>
                        </VListItem>
                      </VList>
                    </div>
                  </div>
                </VCardText>
                <VDivider v-if="viewingContainer?.type === 'Trolley' && availableWarehouseItems.length > 0" />

                <!-- Available Trolleys for Flight Loading (at top of planning tab) -->
                <VCardText v-if="viewingContainer?.type === 'Flight'" class="pa-3 pa-md-4 pb-2">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <div class="text-subtitle-2 font-weight-bold">Load Trolleys to Flight</div>
                    <div v-if="selectedTrolleys.size > 0" class="d-flex align-center gap-2">
                      <VChip size="small" color="primary" variant="tonal">{{ selectedTrolleys.size }} selected
                      </VChip>
                      <VBtn size="x-small" icon="mdi:close" variant="text" @click="selectedTrolleys.clear()" />
                    </div>
                  </div>
                  <div v-if="trolleysLoading" class="text-center py-4">
                    <VProgressCircular indeterminate size="24" width="2" color="primary" />
                    <div class="text-caption mt-2">Loading available trolleys...</div>
                  </div>
                  <div v-else-if="availableTrolleys.length === 0" class="text-center py-4">
                    <VIcon size="40" class="mb-2 text-disabled">mdi:dolly</VIcon>
                    <div class="text-body-2 text-medium-emphasis">No trolleys available to load</div>
                  </div>
                  <div v-else>
                    <!-- CARD VIEW FOR TROLLEYS -->
                    <div v-if="viewMode === 'card'" class="mb-3">
                      <VRow dense>
                        <VCol v-for="trolley in availableTrolleys" :key="trolley.trolleyId" cols="12" xs="6" sm="6"
                          md="4" lg="3">
                          <VCard :class="{ 'container-card-selected': selectedTrolleys.has(trolley.trolleyId) }"
                            :outlined="!selectedTrolleys.has(trolley.trolleyId)" elevation="1" hover class="h-100">
                            <!-- Checkbox -->
                            <div class="position-absolute"
                              style="z-index: 1; inset-block-start: 8px; inset-inline-start: 8px;">
                              <VCheckbox :model-value="selectedTrolleys.has(trolley.trolleyId)" density="compact"
                                @click.stop
                                @update:model-value="(v) => { if (v) selectedTrolleys.add(trolley.trolleyId); else selectedTrolleys.delete(trolley.trolleyId) }" />
                            </div>

                            <!-- Kebab Menu -->
                            <div class="position-absolute"
                              style="z-index: 1; inset-block-start: 8px; inset-inline-end: 8px;">
                              <VMenu>
                                <template #activator="{ props }">
                                  <VBtn icon="mdi:dots-vertical" size="x-small" variant="text" v-bind="props"
                                    @click.stop />
                                </template>
                                <VList density="compact">
                                  <VListItem @click.stop="showFlightLoadDialog(trolley)">
                                    <template #prepend>
                                      <VIcon icon="mdi:plus" />
                                    </template>
                                    <VListItemTitle>Load Trolley</VListItemTitle>
                                  </VListItem>
                                  <VListItem v-if="selectedTrolleys.has(trolley.trolleyId)"
                                    @click.stop="selectedTrolleys.delete(trolley.trolleyId)">
                                    <template #prepend>
                                      <VIcon icon="mdi:close" />
                                    </template>
                                    <VListItemTitle>Deselect</VListItemTitle>
                                  </VListItem>
                                </VList>
                              </VMenu>
                            </div>

                            <VCardText class="pa-3 ps-12">
                              <div class="text-subtitle-2 font-weight-bold mb-1">{{ trolley.trolleyLabel }}</div>
                              <div class="text-caption text-grey mb-2">Status: {{ trolley.status }}</div>
                              <VChip size="x-small" variant="tonal" color="info">
                                {{ trolley.itemsCount }} items
                              </VChip>
                            </VCardText>
                          </VCard>
                        </VCol>
                      </VRow>
                    </div>

                    <!-- LIST VIEW FOR TROLLEYS -->
                    <div v-else>
                      <VList density="compact" class="pa-0 border rounded">
                        <VListItem v-for="trolley in availableTrolleys" :key="trolley.trolleyId"
                          :class="{ 'bg-blue-lighten-5': selectedTrolleys.has(trolley.trolleyId) }" class="py-2 px-3">
                          <template #prepend>
                            <VCheckbox :model-value="selectedTrolleys.has(trolley.trolleyId)" density="compact"
                              @click.stop
                              @update:model-value="(v) => { if (v) selectedTrolleys.add(trolley.trolleyId); else selectedTrolleys.delete(trolley.trolleyId) }" />
                          </template>

                          <VListItemTitle class="text-subtitle-2 font-weight-bold">{{ trolley.trolleyLabel }}
                          </VListItemTitle>
                          <VListItemSubtitle class="text-caption">Status: {{ trolley.status }}</VListItemSubtitle>

                          <template #append>
                            <div class="d-flex align-center gap-2">
                              <VChip size="small" variant="tonal" color="info">{{ trolley.itemsCount }} items</VChip>
                              <VMenu>
                                <template #activator="{ props }">
                                  <VBtn icon="mdi:dots-vertical" size="x-small" variant="text" v-bind="props"
                                    @click.stop />
                                </template>
                                <VList density="compact">
                                  <VListItem @click.stop="showFlightLoadDialog(trolley)">
                                    <template #prepend>
                                      <VIcon icon="mdi:plus" />
                                    </template>
                                    <VListItemTitle>Load Trolley</VListItemTitle>
                                  </VListItem>
                                  <VListItem v-if="selectedTrolleys.has(trolley.trolleyId)"
                                    @click.stop="selectedTrolleys.delete(trolley.trolleyId)">
                                    <template #prepend>
                                      <VIcon icon="mdi:close" />
                                    </template>
                                    <VListItemTitle>Deselect</VListItemTitle>
                                  </VListItem>
                                </VList>
                              </VMenu>
                            </div>
                          </template>
                        </VListItem>
                      </VList>
                    </div>
                  </div>
                </VCardText>
                <VDivider v-if="viewingContainer?.type === 'Flight' && availableTrolleys.length > 0" />

                <!-- Available Planning Containers -->
                <VCardText
                  v-if="planningContainers.length === 0 && viewingContainer?.type !== 'Trolley' && viewingContainer?.type !== 'Flight'"
                  class="text-center py-8">
                  <VIcon size="48" class="mb-2 text-disabled">mdi:folder-open</VIcon>
                  <div class="text-body-2 text-medium-emphasis">No available containers for planning</div>
                </VCardText>

                <template v-else-if="planningContainers.length > 0">
                  <!-- Filter Section -->
                  <VCardText class="pa-2 pa-sm-3 pa-md-4 pb-2">
                    <VRow dense align="center">
                      <VCol cols="12" sm="6" md="6">
                        <VTextField v-model="searchQuery" placeholder="Search items..." prepend-inner-icon="mdi:magnify"
                          density="compact" variant="outlined" />
                      </VCol>
                      <VCol cols="12" sm="6" md="6">
                        <VSelect v-model="filterByType"
                          :items="[{ title: 'All Types', value: null }, ...availableConfigs.map(c => ({ title: c.type, value: c.type }))]"
                          clearable placeholder="Filter by type" item-title="title" item-value="value" density="compact"
                          variant="outlined" />
                      </VCol>
                    </VRow>
                  </VCardText>
                  <VDivider />

                  <!-- Planning Items Card Grid -->
                  <VCardText v-if="viewMode === 'card'" class="pa-2 pa-sm-3 pa-md-4">
                    <VRow dense>
                      <VCol v-for="container in planningContainers" :key="container.id" cols="12" xs="6" sm="6" md="4"
                        lg="3" @click.stop="toggleSelectRelatedContainer(container)">
                        <VCard class="airbnb-card-container h-100 position-relative"
                          :class="{ 'container-card-selected': isContainerCardSelected(container) }" elevation="3" hover
                          :outlined="isRelatedContainerSelected(container)">
                          <div class="position-absolute"
                            style="z-index: 1; inset-block-start: 8px; inset-inline-start: 8px;">
                            <VCheckbox v-if="isLeafRelatedContainer(container)"
                              :model-value="isRelatedContainerSelected(container)" density="compact"
                              @click.stop="toggleSelectRelatedContainer(container)"
                              @update:model-value="toggleSelectRelatedContainer(container)" />
                          </div>

                          <div class="position-absolute"
                            style="z-index: 1; inset-block-start: 8px; inset-inline-end: 8px;">
                            <VMenu>
                              <template #activator="{ props }">
                                <VBtn icon="mdi:dots-vertical" size="x-small" variant="text" v-bind="props"
                                  @click.stop />
                              </template>
                              <VList density="compact">
                                <VListItem v-for="action in getContainerDetailActions(container)" :key="action?.id"
                                  @click.stop="handleAction(action, container)">
                                  <template #prepend>
                                    <VIcon :icon="action?.icon || 'mdi:play'" />
                                  </template>
                                  <VListItemTitle>{{ action?.label }}</VListItemTitle>
                                </VListItem>
                              </VList>
                            </VMenu>
                          </div>

                          <div class="d-flex justify-center align-center pa-4 bg-grey-lighten-3">
                            <VIcon icon="mdi:package" size="40" color="grey-darken-2" />
                          </div>
                          <VCardText class="pa-2 pa-md-3 d-flex flex-column">
                            <div class="d-flex justify-space-between align-start mb-1 mb-md-2 gap-1">
                              <div class="min-width-0 flex-grow-1 pr-2">
                                <div class="text-caption text-sm-subtitle-2 font-weight-bold text-truncate">
                                  {{ container.label }}
                                </div>
                              </div>
                              <VChip size="small" variant="tonal" :color="getLifecycleColor(container.lifecycle)"
                                class="flex-shrink-0 font-weight-bold">
                                {{ container.lifecycle }}
                              </VChip>
                            </div>

                            <div v-if="container.description" class="text-caption text-grey text-truncate flex-grow-1">
                              {{ container.description }}
                            </div>

                            <!-- Warehouse Inventory Display -->
                            <div v-if="warehouseInventory.has(container.id)"
                              class="mt-2 pa-2 bg-amber-lighten-4 rounded">
                              <div class="text-caption font-weight-bold text-amber-darken-2">
                                📦 {{ warehouseInventory.get(container.id)?.quantityAvailable || 0 }}/{{
                                  warehouseInventory.get(container.id)?.quantityOnHand || 0 }} Available
                              </div>
                            </div>

                            <VBtn size="x-small" variant="text" color="primary"
                              @click.stop="viewRelatedContainers(container)" class="mt-2">
                              <template #prepend>
                                <VIcon icon="mdi:chevron-right" size="16" />
                              </template>
                              View Details
                            </VBtn>
                          </VCardText>
                        </VCard>
                      </VCol>
                    </VRow>
                  </VCardText>

                  <!-- Planning Items List -->
                  <VCardText v-if="viewMode === 'list'" class="pa-0">
                    <VList density="compact">
                      <VListItem v-for="container in planningContainers" :key="container.id" class="py-2 px-3 rounded-0"
                        :class="{ 'bg-blue-lighten-5': isRelatedContainerSelected(container) }"
                        @click.stop="toggleSelectRelatedContainer(container)">
                        <template #prepend>
                          <VCheckbox v-if="isLeafRelatedContainer(container)"
                            :model-value="isRelatedContainerSelected(container)" density="compact"
                            @click.stop="toggleSelectRelatedContainer(container)"
                            @update:model-value="toggleSelectRelatedContainer(container)" />
                        </template>

                        <VListItemTitle class="font-weight-bold ms-2">{{ container.label }}</VListItemTitle>

                        <template #append>
                          <div class="d-flex align-center gap-2">
                            <VChip size="small" variant="tonal" :color="getLifecycleColor(container.lifecycle)"
                              class="font-weight-bold">
                              {{ container.lifecycle }}
                            </VChip>

                            <VMenu>
                              <template #activator="{ props }">
                                <VBtn icon="mdi:dots-vertical" size="x-small" variant="text" v-bind="props"
                                  @click.stop />
                              </template>
                              <VList density="compact">
                                <VListItem v-for="action in getContainerDetailActions(container)" :key="action?.id"
                                  @click.stop="handleAction(action, container)">
                                  <template #prepend>
                                    <VIcon :icon="action?.icon || 'mdi:play'" />
                                  </template>
                                  <VListItemTitle>{{ action?.label }}</VListItemTitle>
                                </VListItem>
                              </VList>
                            </VMenu>
                          </div>
                        </template>
                      </VListItem>
                    </VList>
                  </VCardText>
                </template>
              </VWindowItem>

              <VWindowItem value="planned">
                <!-- Planned Items Head with Selection Counter -->

                <VCardText class="pa-3 pa-md-4 pb-2">
                  <div v-if="plannedContainers.length > 0" class="d-flex align-center justify-space-between mb-3">
                    <div class="text-subtitle-2 font-weight-bold">Planned Items ({{ plannedContainers.length }})</div>
                    <div v-if="selectedRelatedContainers.size > 0" class="d-flex align-center gap-2">
                      <VChip size="small" color="primary" variant="tonal">{{ selectedRelatedContainers.size }} selected
                      </VChip>
                      <VBtn size="x-small" icon="mdi:close" variant="text" @click="clearPlannedItemsSelection()" />
                    </div>
                  </div>

                  <!-- CARD VIEW FOR PLANNED ITEMS -->
                  <div v-if="plannedContainers.length > 0 && viewMode === 'card'" class="mb-3">
                    <VRow dense>
                      <VCol v-for="container in plannedContainers" :key="container.id" cols="12" xs="6" sm="6" md="4"
                        lg="3">

                        <VCard :class="{ 'container-card-selected': isRelatedContainerSelected(container) }"
                          :outlined="!isRelatedContainerSelected(container)" elevation="1" hover>
                          <!-- Checkbox -->
                          <div class="position-absolute"
                            style="z-index: 1; inset-block-start: 8px; inset-inline-start: 8px;">
                            <VCheckbox v-if="isLeafRelatedContainer(container)"
                              :model-value="isRelatedContainerSelected(container)" density="compact" @click.stop
                              @update:model-value="toggleSelectRelatedContainer(container)" />
                          </div>

                          <!-- Kebab Menu -->
                          <div class="position-absolute"
                            style="z-index: 1; inset-block-start: 8px; inset-inline-end: 8px;">
                            <VMenu>
                              <template #activator="{ props }">
                                <VBtn icon="mdi:dots-vertical" size="x-small" variant="text" v-bind="props"
                                  @click.stop />
                              </template>
                              <VList density="compact">
                                <VListItem v-for="action in getContainerDetailActions(container)" :key="action?.id"
                                  @click.stop="handleAction(action, container)">
                                  <template #prepend>
                                    <VIcon :icon="action?.icon || 'mdi:play'" />
                                  </template>
                                  <VListItemTitle>{{ action?.label }}</VListItemTitle>
                                </VListItem>
                              </VList>
                            </VMenu>
                          </div>

                          <VCardText class="pa-3 ps-12">
                            {{(() => {
                              if (plannedContainers.length > 0) console.log('Item:', JSON.stringify(container,
                                null, 2));
                              return null
                            })()}}
                            <div class="d-flex justify-space-between align-start mb-1">
                              <div class="text-subtitle-2 font-weight-bold">{{ container.label }}</div>
                              <!-- Show item count for trolleys, or quantity for inventory items -->
                              <VChip v-if="container.type === 'Trolley' && getContainerItemCount(container.id) > 0"
                                size="small" variant="tonal" color="info">
                                {{ getContainerItemCount(container.id) }} items
                              </VChip>
                              <VChip v-else-if="container.quantity" size="small" variant="tonal" color="success">
                                {{ container.quantity }} units
                              </VChip>
                            </div>
                            <div class="text-caption text-grey mb-2">{{ container.type }} | {{ container.description }}
                            </div>
                            <VChip v-if="container.lifecycle" size="x-small" variant="tonal" color="primary">
                              {{ container.lifecycle }}
                            </VChip>
                          </VCardText>
                        </VCard>
                      </VCol>
                    </VRow>
                  </div>

                  <!-- LIST VIEW FOR PLANNED ITEMS -->
                  <div v-else-if="plannedContainers.length > 0">
                    <VList density="compact" class="pa-0 border rounded">
                      <VListItem v-for="container in plannedContainers" :key="container.id"
                        :class="{ 'bg-blue-lighten-5': isRelatedContainerSelected(container) }" class="py-2 px-3">
                        <template #prepend>
                          <VCheckbox v-if="isLeafRelatedContainer(container)"
                            :model-value="isRelatedContainerSelected(container)" density="compact" @click.stop
                            @update:model-value="toggleSelectRelatedContainer(container)" />
                        </template>

                        <VListItemTitle class="text-subtitle-2 font-weight-bold">
                          {{ container.label }}
                          <VChip v-if="container.type === 'Trolley' && getContainerItemCount(container.id) > 0"
                            size="x-small" variant="tonal" color="info" class="ml-2">
                            {{ getContainerItemCount(container.id) }} items
                          </VChip>
                          <VChip v-else-if="container.quantity" size="x-small" variant="tonal" color="success"
                            class="ml-2">
                            {{ container.quantity }} units
                          </VChip>
                        </VListItemTitle>
                        <VListItemSubtitle class="text-caption">{{ container.type }} | {{ container.description }}
                        </VListItemSubtitle>

                        <template #append>
                          <div class="d-flex align-center gap-2">
                            <VChip v-if="container.lifecycle" size="small" variant="tonal" color="primary">
                              {{ container.lifecycle }}
                            </VChip>
                            <VMenu>
                              <template #activator="{ props }">
                                <VBtn icon="mdi:dots-vertical" size="x-small" variant="text" v-bind="props"
                                  @click.stop />
                              </template>
                              <VList density="compact">
                                <VListItem v-for="action in getContainerDetailActions(container)" :key="action?.id"
                                  @click.stop="handleAction(action, container)">
                                  <template #prepend>
                                    <VIcon :icon="action?.icon || 'mdi:play'" />
                                  </template>
                                  <VListItemTitle>{{ action?.label }}</VListItemTitle>
                                </VListItem>
                              </VList>
                            </VMenu>
                          </div>
                        </template>
                      </VListItem>
                    </VList>
                  </div>

                  <!-- Empty State -->
                  <div v-else class="text-center py-8">
                    <VIcon size="48" class="mb-2 text-disabled">mdi:folder-open</VIcon>
                    <div class="text-body-2 text-medium-emphasis">No planned items yet</div>
                  </div>
                </VCardText>
              </VWindowItem>
            </VWindow>
          </VCard>
        </VCol>
      </VRow>
    </div>

    <!-- SNACKBAR FOR NOTIFICATIONS -->
    <VSnackbar v-model="snackbar" :color="snackbarColor" location="top" timeout="4000">
      {{ snackbarMessage }}
    </VSnackbar>

    <!-- QUANTITY INPUT DIALOG -->
    <VDialog v-model="showQuantityDialog" max-width="500px">
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between">
          <span>Enter Quantity to Receive</span>
          <VBtn icon="mdi:close" variant="text" size="small" @click="showQuantityDialog = false" />
        </VCardTitle>

        <VCardText class="py-4">
          <div v-if="selectedItemForQuantity" class="mb-4">
            <div class="text-subtitle-2 font-weight-bold mb-2">
              {{ selectedItemForQuantity.label || selectedItemForQuantity.name }}
            </div>
            <div class="text-body-2 text-grey mb-4">
              SKU: {{ selectedItemForQuantity.sku || selectedItemForQuantity.id }}
            </div>

            <VTextField v-model.number="inputQuantity" label="Quantity" type="number"
              hint="Enter quantity to receive (must be greater than 0)" persistent-hint outlined dense min="1" />
          </div>
        </VCardText>

        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn color="default" variant="tonal" @click="showQuantityDialog = false">
            Cancel
          </VBtn>
          <VBtn color="primary" :disabled="!inputQuantity || inputQuantity <= 0" @click="confirmQuantityAndAttach">
            Receive
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- TROLLEY LOAD QUANTITY DIALOG -->
    <VDialog v-model="trolleyLoadDialog" max-width="500px">
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between">
          <span>Load Items to Trolley</span>
          <VBtn icon="mdi:close" variant="text" size="small" @click="trolleyLoadDialog = false" />
        </VCardTitle>

        <VCardText class="py-4">
          <div v-if="trolleyLoadItem" class="mb-4">
            <div class="text-subtitle-2 font-weight-bold mb-2">
              {{ trolleyLoadItem.itemLabel }}
            </div>
            <div class="text-body-2 text-grey mb-1">
              Warehouse: {{ trolleyLoadItem.warehouseLabel }}
            </div>
            <div class="text-body-2 text-grey mb-4">
              Available: {{ trolleyLoadItem.quantityOnHand }} units
            </div>

            <VTextField v-model.number="trolleyLoadQuantity" label="Quantity to Load" type="number"
              :hint="`Enter quantity (max: ${trolleyLoadItem.quantityOnHand})`" persistent-hint outlined dense min="1"
              :max="trolleyLoadItem.quantityOnHand" />
          </div>
        </VCardText>

        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn color="default" variant="tonal" @click="trolleyLoadDialog = false">
            Cancel
          </VBtn>
          <VBtn color="primary"
            :disabled="!trolleyLoadQuantity || trolleyLoadQuantity <= 0 || trolleyLoadQuantity > (trolleyLoadItem?.quantityOnHand || 0)"
            @click="confirmTrolleyLoad">
            Load
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- FLIGHT LOAD TROLLEY DIALOG -->
    <VDialog v-model="flightLoadDialog" max-width="500px">
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between">
          <span>Load Trolley to Flight</span>
          <VBtn icon="mdi:close" variant="text" size="small" @click="flightLoadDialog = false" />
        </VCardTitle>

        <VCardText class="py-4">
          <div v-if="flightLoadTrolley" class="mb-4">
            <div class="text-subtitle-2 font-weight-bold mb-2">
              {{ flightLoadTrolley.trolleyLabel }}
            </div>
            <div class="text-body-2 text-grey mb-1">
              Status: {{ flightLoadTrolley.status }}
            </div>
            <div class="text-body-2 text-grey mb-4">
              Items Inside: {{ flightLoadTrolley.itemsCount }}
            </div>

            <VAlert type="info" variant="tonal" class="mb-4">
              This trolley will be loaded to flight <strong>{{ viewingContainer?.label || viewingContainer?.id
              }}</strong>
            </VAlert>
          </div>
        </VCardText>

        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn color="default" variant="tonal" @click="flightLoadDialog = false">
            Cancel
          </VBtn>
          <VBtn color="primary" @click="confirmFlightLoad">
            Load Trolley
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VContainer>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Container, ContainerAction } from '~/types/emcContainer'
import type { ConfigAction, ContainerConfig } from '~/types/emcContainerConfig'
import { containerConfigs } from '~/utils/emcContainerConfig'

interface ContainerMovementRecord {
  _id: string
  actionLabel?: string
  movementType: string
  parentContainerId: string
  childContainerId: string
  fromStatus?: string
  toStatus: string
  movedBy?: string
  movedByName?: string
  movedByCode?: string
  movedAt?: string
  createdAt?: string
}

// Auth-aware fetch: always sends session cookie so server middleware can validate it.
const api = <T = any>(url: string, opts?: Parameters<typeof $fetch>[1]): Promise<T> =>
  $fetch<T>(url, { credentials: 'include', ...opts })

// Get user session/auth context
const { data: sessionData } = useAuth()

// State management
const viewMode = ref<'card' | 'list'>('card')
const planningTab = ref<'planning' | 'planned'>('planning')
const selectedRelatedContainers = ref<Set<string>>(new Set())  // Multi-select for related containers on right panel
const viewingContainer = ref<Container | null>(null)   // For showing details panel
const selectedRelatedContainer = ref<Container | null>(null)   // For visual selection on right panel
const selectedConfig = ref<ContainerConfig | null>(null)
const searchQuery = ref('')
const filterByType = ref<string | null>(null)
const filterByLifecycle = ref('')

// API state
const isLoading = ref(false)
const configsLoading = ref(false)
const error = ref<string | null>(null)
const containers = ref<Container[]>([])
const organizationConfigs = ref<any>(null)
const associations = ref<any[]>([])
const historyLoading = ref(false)
const movementHistory = ref<ContainerMovementRecord[]>([])
const allInvItems = ref<any[]>([])  // All inventory items from emcInvItem

// Quantity dialog state
const showQuantityDialog = ref(false)
const selectedItemForQuantity = ref<any>(null)
const inputQuantity = ref(0)
const warehouseInventory = ref<Map<string, any>>(new Map())
const itemQuantityMap = ref<Map<string, number>>(new Map()) // Track quantities for each item being attached

// Trolley warehouse items loading
const warehouseItemsLoading = ref(false)
const availableWarehouseItems = ref<any[]>([])
const selectedWarehouseItems = ref<Set<string>>(new Set())  // Track selected items for bulk actions
const trolleyLoadDialog = ref(false)
const trolleyLoadItem = ref<any>(null)
const trolleyLoadQuantity = ref(0)

// Flight trolley loading
const trolleysLoading = ref(false)
const availableTrolleys = ref<any[]>([])
const selectedTrolleys = ref<Set<string>>(new Set())  // Track selected trolleys for bulk actions
const flightLoadDialog = ref(false)
const flightLoadTrolley = ref<any>(null)

// Watch availableWarehouseItems for changes
watch(availableWarehouseItems, (newVal, oldVal) => {
  console.log('🔍 [WATCH] availableWarehouseItems changed')
  console.log('   Old value:', oldVal?.length || 0, 'items')
  console.log('   New value:', newVal?.length || 0, 'items')
  if (newVal && newVal.length > 0) {
    console.log('   Sample:', newVal[0])
  }
}, { deep: true })

// Watch availableTrolleys for changes
watch(availableTrolleys, (newVal, oldVal) => {
  console.log('🔍 [WATCH] availableTrolleys changed')
  console.log('   Old value:', oldVal?.length || 0, 'trolleys')
  console.log('   New value:', newVal?.length || 0, 'trolleys')
  if (newVal && newVal.length > 0) {
    console.log('   Sample:', newVal[0])
  }
}, { deep: true })

// Computed property to debug trolley items section rendering
const trolleyItemsDebug = computed(() => {
  console.log('[RENDER DEBUG] Trolley Items Section:')
  console.log('   isTrolley:', viewingContainer.value?.type === 'Trolley')
  console.log('   isLoading:', warehouseItemsLoading.value)
  console.log('   itemsLength:', availableWarehouseItems.value?.length || 0)
  console.log('   shouldShowLoading:', warehouseItemsLoading.value && viewingContainer.value?.type === 'Trolley')
  console.log('   shouldShowEmpty:', !warehouseItemsLoading.value && (availableWarehouseItems.value?.length === 0) && viewingContainer.value?.type === 'Trolley')
  console.log('   shouldShowList:', !warehouseItemsLoading.value && availableWarehouseItems.value?.length > 0 && viewingContainer.value?.type === 'Trolley')

  return {
    isTrolley: viewingContainer.value?.type === 'Trolley',
    isLoading: warehouseItemsLoading.value,
    itemsCount: availableWarehouseItems.value?.length || 0
  }
})

// Computed property to debug flight trolleys section rendering
const flightTrolleysDebug = computed(() => {
  console.log('[RENDER DEBUG] Flight Trolleys Section:')
  console.log('   isFlight:', viewingContainer.value?.type === 'Flight')
  console.log('   isLoading:', trolleysLoading.value)
  console.log('   trolleysLength:', availableTrolleys.value?.length || 0)
  console.log('   shouldShowLoading:', trolleysLoading.value && viewingContainer.value?.type === 'Flight')
  console.log('   shouldShowEmpty:', !trolleysLoading.value && (availableTrolleys.value?.length === 0) && viewingContainer.value?.type === 'Flight')
  console.log('   shouldShowList:', !trolleysLoading.value && availableTrolleys.value?.length > 0 && viewingContainer.value?.type === 'Flight')

  return {
    isFlight: viewingContainer.value?.type === 'Flight',
    isLoading: trolleysLoading.value,
    trolleysCount: availableTrolleys.value?.length || 0
  }
})

// Notification/Snackbar state
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref<'success' | 'error' | 'warning' | 'info'>('info')

// Fetch containers from API
const fetchContainers = async (containerType?: string) => {
  isLoading.value = true
  error.value = null

  try {
    let url = '/api/emc/emcContainerManagement?type=containers'
    if (containerType) {
      url += `&containerType=${containerType}`
    }

    const response = await api<any>(url)

    if (response?.success) {
      containers.value = response.data || []
      console.log(`✅ Containers loaded: ${containers.value.length} total`)

      // Log breakdown by type
      const typeCount: Record<string, number> = {}
      containers.value.forEach((c: any) => {
        typeCount[c.type] = (typeCount[c.type] || 0) + 1
      })
      console.log('📊 Containers by type:', JSON.stringify(typeCount, null, 2))

      // Specifically log Flight instances
      const flightInstances = containers.value.filter((c: any) => c.type === 'Flight')
      console.log(`🚁 Flight instances found: ${flightInstances.length}`)
      if (flightInstances.length > 0) {
        console.log('Flight instances:', flightInstances.map((f: any) => ({ id: f.id, label: f.label })))
      }
    } else {
      error.value = response?.error || 'Failed to fetch containers'
      console.error('API error:', error.value)
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch containers'
    console.error('Fetch error:', err)
  } finally {
    isLoading.value = false
  }
}

// Fetch organization container configs from API
const fetchOrganizationConfigs = async () => {
  configsLoading.value = true
  error.value = null

  try {
    const response = await api<any>('/api/emc/emcContainerManagement?type=organizationConfigs')

    if (response?.success) {
      organizationConfigs.value = response.data
      console.log('Organization configs loaded:', organizationConfigs.value)

      // DEBUG: Log all configs with their actions and masterActions
      if (organizationConfigs.value?.configs) {
        organizationConfigs.value.configs.forEach((config: any) => {
          console.log(`[DEBUG] Config: ${config.type}`)
          console.log(`  - masterActions: ${Object.keys(config.masterActions || {}).length} keys`)
          if (config.masterActions) {
            Object.entries(config.masterActions).forEach(([key, action]: any) => {
              console.log(`    * ${key}: ${action?.label || 'no label'}`)
            })
          }
          console.log(`  - actions: ${config.actions?.length || 0} actions`)
        })
      }
    } else {
      error.value = response?.error || 'Failed to fetch organization configs'
      console.error('API error:', error.value)
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch organization configs'
    console.error('Fetch error:', err)
  } finally {
    configsLoading.value = false
  }
}

// Fetch associations for the viewing container
const fetchAssociations = async () => {
  if (!viewingContainer.value) {
    associations.value = []
    return
  }

  try {
    console.log('🔍 Fetching associations for:', viewingContainer.value.id)
    const response = await api<any>('/api/emc/container-associations?parentContainerId=' + viewingContainer.value.id)

    if (response?.success) {
      associations.value = response.data || []
      console.log(`✅ Associations loaded: ${associations.value.length}`)
      console.log('📋 Association details:', JSON.stringify(associations.value.map((a: any) => ({
        parentId: a.parentContainerId,
        childIds: a.childContainerIds,
        quantities: a.itemQuantities
      })), null, 2))

      // For trolleys, fetch items based on associated IDs
      if (viewingContainer.value?.type === 'Trolley' && associations.value.length > 0) {
        console.log('🔗 Fetching associated items for trolley...')
        const associatedItemIds = new Set<string>()
        associations.value.forEach((assoc: any) => {
          assoc.childContainerIds?.forEach((id: string) => {
            associatedItemIds.add(id)
          })
        })

        if (associatedItemIds.size > 0) {
          await fetchItemsByIds(Array.from(associatedItemIds))
        }
      }
    } else {
      associations.value = []
      console.warn('No associations found')
    }
  } catch (err) {
    associations.value = []
    console.warn('Error fetching associations:', err)
  }
}

// Fetch specific items by their IDs
const fetchItemsByIds = async (itemIds: string[]) => {
  try {
    console.log(`📥 Fetching ${itemIds.length} items by ID`)

    // Try to fetch items from inventory API
    const response = await api<any>('/api/emc/inventory/items-by-ids', {
      method: 'POST',
      body: { itemIds }
    })

    if (response?.success && response.data) {
      allInvItems.value = response.data
      console.log(`✅ Loaded ${allInvItems.value.length} items for trolley`)
    } else {
      console.warn('No items found by IDs')
    }
  } catch (err) {
    console.warn('Error fetching items by ID:', err)
  }
}

// Fetch warehouse inventory for all items
const fetchWarehouseInventory = async (itemIds?: string[]) => {
  try {
    console.log('📦 Fetching warehouse inventory')
    let url = '/api/emc/warehouse-inventory'

    if (itemIds && itemIds.length > 0) {
      // For each item, fetch inventory
      const responses = await Promise.all(
        itemIds.map(id => api<any>(`/api/emc/warehouse-inventory?itemId=${id}`))
      )
      responses.forEach((resp: any) => {
        if (resp?.success && resp.data && resp.data.length > 0) {
          resp.data.forEach((inv: any) => {
            warehouseInventory.value.set(inv.itemId, inv)
          })
        }
      })
    } else {
      const response = await api<any>(url)
      if (response?.success && response.data) {
        response.data.forEach((inv: any) => {
          warehouseInventory.value.set(inv.itemId, inv)
        })
      }
    }
    console.log(`✅ Warehouse inventory loaded: ${warehouseInventory.value.size} items`)
  } catch (err) {
    console.warn('Failed to fetch warehouse inventory:', err)
  }
}

// Fetch all inventory items from emcInvItem for planning tab
const fetchAllInvItems = async (warehouseId?: string) => {
  try {
    console.log(`📦 Fetching inventory items${warehouseId ? ` for warehouse ${warehouseId}` : ''}`)

    // If a warehouse ID is provided, use the unified endpoint that returns both associated and all products
    if (warehouseId) {
      const response = await api<any>('/api/emc/warehouse-items', {
        query: {
          organizationId: 12313,
          status: 'active',
          parentContainerId: warehouseId
        }
      })

      if (response?.success && response.data) {
        // Store all products from emcInvItem
        allInvItems.value = response.data.allProducts || []
        console.log(`✅ Loaded ${allInvItems.value.length} items for warehouse ${warehouseId}`)
        if (allInvItems.value.length > 0) {
          console.log('📦 Sample product:', JSON.stringify(allInvItems.value[0], null, 2))
        }
      } else {
        allInvItems.value = []
        console.warn('❌ Failed to load products:', response?.error)
      }
    } else {
      // If no warehouse ID, fetch all items from emcInvItem
      const response = await api<any>('/api/emc/inventory/all-items')

      if (response?.success && Array.isArray(response.data)) {
        allInvItems.value = response.data
        console.log(`✅ All inventory items loaded: ${allInvItems.value.length}`)
      } else {
        allInvItems.value = []
        console.warn('Failed to fetch all inventory items')
      }
    }
  } catch (err) {
    allInvItems.value = []
    console.warn('Failed to fetch all inventory items:', err)
  }
}

// Load data client-side so session cookies are available
onMounted(async () => {
  await Promise.all([fetchContainers(), fetchOrganizationConfigs(), fetchAllInvItems()])
  await fetchWarehouseInventory()
})

// Get available configs for organization
const availableConfigs = computed((): ContainerConfig[] => {
  if (!organizationConfigs.value?.configs) {
    return []
  }
  return organizationConfigs.value.configs as ContainerConfig[]
})

// Helper: Get config for a specific container type
const getConfigForContainer = (containerType: string): ContainerConfig | undefined => {
  console.log(`[DEBUG getConfigForContainer] Looking for type: ${containerType}`)
  console.log(`[DEBUG getConfigForContainer] availableConfigs count: ${availableConfigs.value.length}`)
  console.log(`[DEBUG getConfigForContainer] availableConfigs types:`, availableConfigs.value.map(c => c.type))
  const result = availableConfigs.value.find(config => config.type === containerType)
  console.log(`[DEBUG getConfigForContainer] Found config: ${!!result}`)
  return result
}

const normalizeActionCollection = (source: any): ConfigAction[] => {
  if (!source) return []
  if (Array.isArray(source)) return source as ConfigAction[]
  if (typeof source === 'object') return Object.values(source) as ConfigAction[]
  return []
}

const getMasterActionsFromConfig = (config: any): ConfigAction[] => {
  let actions = normalizeActionCollection(config?.masterActions ?? config?.MasterActions)

  // If no master actions found in config, try to get from utility config as fallback
  if (actions.length === 0 && config?.type) {
    console.log(`[DEBUG getMasterActions] No masterActions in database config for ${config.type}, checking fallback`)
    const orgId = config.organizationId || 12313
    const fallbackConfig = containerConfigs
      .find(org => org.organizationId === orgId)
      ?.configs.find(c => c.type === config.type)

    if (fallbackConfig?.masterActions) {
      actions = normalizeActionCollection(fallbackConfig.masterActions)
      console.log(`[DEBUG getMasterActions] Found ${actions.length} masterActions from utility config fallback`)
    }
  }

  if (config?.type) {
    console.log(`[DEBUG getMasterActions] ${config.type}: masterActions=${actions.length}`)
  }
  return actions
}

const getDetailActionsFromConfig = (config: any): ConfigAction[] => {
  const actions = normalizeActionCollection(config?.actions)
  if (config?.type && actions.length > 0) {
    console.log(`[DEBUG] ${config.type} actions:`, actions)
  }
  return actions
}

const selectedConfigMasterActions = computed((): ConfigAction[] => {
  console.log('[DEBUG selectedConfigMasterActions] selectedConfig:', selectedConfig.value?.type)
  if (!selectedConfig.value) {
    console.log('[DEBUG selectedConfigMasterActions] No selectedConfig')
    return []
  }
  const config = selectedConfig.value
  console.log('[DEBUG selectedConfigMasterActions] Config object:', {
    type: config.type,
    hasMasterActions: !!config.masterActions,
    masterActionsKeys: Object.keys(config.masterActions || {})
  })
  const actions = getMasterActionsFromConfig(config)
  console.log(`[DEBUG selectedConfigMasterActions] Returning ${actions.length} actions`)
  actions.forEach(a => console.log(`  - ${a.label} (${a.id})`))
  return actions
})

const normalizeLifecycle = (value?: string): string => {
  if (!value) return ''
  const map: Record<string, string> = {
    Available: 'READY',
    'In Progress': 'ACTIVE',
    'In Use': 'ACTIVE',
    Attached: 'ACTIVE',
    Maintenance: 'CLOSED',
    Closed: 'CLOSED',
    Archived: 'ARCHIVED',
  }

  return map[value] || value.toUpperCase()
}

// Helper: Filter actions based on lifecycle preconditions and user roles
const filterActionsByRoleAndLifecycle = (
  actions: ConfigAction[] | undefined,
  container: Container,
  userRoles: Array<{ id: number; name: string }> | undefined
): ConfigAction[] => {
  if (!actions || actions.length === 0) {
    return []
  }

  return actions.filter(action => {
    // Check lifecycle precondition
    const allowedLifecycles = action.precondition?.lifecycle?.map(lifecycle => normalizeLifecycle(lifecycle)) || []
    const containerLifecycle = normalizeLifecycle(container.lifecycle)

    console.log(`[DEBUG filter] Action: ${action.id}, allowed: [${allowedLifecycles.join(',')}], container: ${containerLifecycle}`)

    if (allowedLifecycles.length > 0 && !allowedLifecycles.includes(containerLifecycle)) {
      console.log(`[DEBUG filter] ❌ Lifecycle mismatch - REJECTED`)
      return false
    }

    // Check role-based access
    if (action.roles && action.roles.length > 0 && userRoles) {
      const userHasRole = action.roles.some(actionRole =>
        userRoles.some(userRole => userRole.id === actionRole.id)
      )
      if (!userHasRole) {
        console.log(`[DEBUG filter] ❌ Role mismatch - REJECTED`)
        return false
      }
    }

    console.log(`[DEBUG filter] ✅ ACCEPTED`)
    return true
  })
}

// Group containers by type
const groupedContainers = computed(() => {
  const grouped: Record<string, { type: string; count: number }> = {}

  containers.value.forEach(c => {
    if (!grouped[c.type]) {
      grouped[c.type] = { type: c.type, count: 0 }
    }
    const group = grouped[c.type]
    if (group) group.count++
  })

  return Object.values(grouped)
})

// Get unique types
const uniqueTypes = computed(() => {
  return [...new Set(containers.value.map(c => c.type))].sort()
})

// Filter containers based on selected config and other filters
const filteredContainers = computed(() => {
  let filtered = containers.value

  // Filter by selected config type
  if (selectedConfig.value) {
    filtered = filtered.filter(c => c.type === selectedConfig.value?.type)
  } else if (filterByType.value) {
    filtered = filtered.filter(c => c.type === filterByType.value)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      c =>
        c.label.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    )
  }

  if (filterByLifecycle.value) {
    filtered = filtered.filter(c => c.lifecycle === filterByLifecycle.value)
  }

  return filtered
})

// Filtered items for Item config type
const filteredItems = computed(() => {
  if (!selectedConfig.value || selectedConfig.value?.type !== 'Item') {
    return []
  }

  let filtered = allInvItems.value

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      item =>
        (item.name || item.label || '').toLowerCase().includes(q) ||
        (item._id || item.id || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q)
    )
  }

  return filtered
})

// Get containers that can be contained in the viewed container
const relatedContainers = computed(() => {
  if (!viewingContainer.value) return []

  // Get the config for the viewed container
  const containerConfig = availableConfigs.value.find(c => c.type === viewingContainer.value?.type)
  if (!containerConfig || !containerConfig.canContain || containerConfig.canContain.length === 0) {
    return []
  }

  // Filter containers by the types that can be contained
  return containers.value.filter(c => containerConfig.canContain?.includes(c.type))
})

const currentContainerConfig = computed(() => {
  if (!viewingContainer.value) return null
  return availableConfigs.value.find(c => c.type === viewingContainer.value?.type) || null
})

const isLeafContainer = computed(() => {
  if (!currentContainerConfig.value) return false
  return !currentContainerConfig.value.canContain || currentContainerConfig.value.canContain.length === 0
})

const planningContainers = computed(() => {
  // Planning: All items from emcInvItem (not filtered out if already associated)
  const currentOrgId = viewingContainer.value?.organizationId || 'default'

  console.log(`🔍 Computing planningContainers:`)
  console.log(`   - Total items available: ${allInvItems.value.length}`)
  console.log(`   - Current org ID: ${currentOrgId}`)

  // Return all items from the same organization
  const filtered = allInvItems.value.filter(item => {
    const orgMatch = (item.organizationId || 'default') === currentOrgId

    if (!orgMatch) {
      console.log(`❌ Item ${item.id}: org mismatch (${item.organizationId} vs ${currentOrgId})`)
    }

    return orgMatch
  })

  console.log(`✅ Planning containers: ${filtered.length}`)

  return filtered
})

const plannedContainers = computed(() => {
  // Planned: items that ARE ASSOCIATED with this parent
  const associatedChildIds = new Set<string>()
  associations.value.forEach(assoc => {
    assoc.childContainerIds?.forEach((id: string) => {
      associatedChildIds.add(id)
    })
  })

  console.log(`📋 Planning Containers:`)
  console.log(`   - Associations count: ${associations.value.length}`)
  console.log(`   - Associated IDs: ${Array.from(associatedChildIds).join(', ')}`)
  console.log(`   - AllInvItems count: ${allInvItems.value.length}`)
  console.log(`   - Viewing container type: ${viewingContainer.value?.type}`)

  if (allInvItems.value.length > 0) {
    console.log(`   - Sample item IDs: ${allInvItems.value.slice(0, 3).map(i => i._id || i.id).join(', ')}`)
  }

  // For warehouses, show associated inventory items
  // For trolleys and other containers, show associated items from allInvItems
  if (viewingContainer.value?.type === 'Warehouse') {
    // For warehouses: include both containers and inventory items from allInvItems
    const allItems = [...relatedContainers.value]

    // Add inventory items that are associated but not in relatedContainers
    const inventoryItems = allInvItems.value
      .filter(item => {
        const itemId = item._id || item.id
        return associatedChildIds.has(itemId) && !allItems.find(c => c.id === itemId)
      })
      .map(item => ({
        ...item,
        quantity: associatedItemQuantities.value.get(item._id || item.id) || 0
      }))

    return [...allItems, ...inventoryItems]
      .filter(c => associatedChildIds.has(c.id))
      .map(item => ({
        ...item,
        quantity: item.quantity ?? (associatedItemQuantities.value.get(item._id || item.id) || 0)
      }))
  } else if (viewingContainer.value?.type === 'Trolley') {
    // For trolleys: show associated inventory items
    const filtered = allInvItems.value
      .filter(item => {
        const itemId = item._id || item.id
        const isAssociated = associatedChildIds.has(itemId)
        if (isAssociated) {
          console.log(`   ✅ Found associated item: ${itemId}`)
        }
        return isAssociated
      })
      .map(item => ({
        ...item,
        quantity: associatedItemQuantities.value.get(item._id || item.id) || 0
      }))
    console.log(`   📍 Trolley planned items count: ${filtered.length}`)
    return filtered
  } else {
    // For other containers: show both containers and associated inventory items
    const allItems = [...relatedContainers.value]
    const inventoryItems = allInvItems.value
      .filter(item => {
        const itemId = item._id || item.id
        return associatedChildIds.has(itemId) && !allItems.find(c => c.id === itemId)
      })
      .map(item => ({
        ...item,
        quantity: associatedItemQuantities.value.get(item._id || item.id) || 0
      }))
    return [...allItems, ...inventoryItems]
      .filter(c => associatedChildIds.has(c.id))
      .map(item => ({
        ...item,
        quantity: item.quantity ?? (associatedItemQuantities.value.get(item._id || item.id) || 0)
      }))
  }
})

// Get fully allocated items (items where all warehouse inventory is already attached to some container)
const fullyAllocatedItems = computed(() => {
  const fullyAllocated = new Set<string>()

  warehouseInventory.value.forEach((inv, itemId) => {
    if (inv.quantityAvailable <= 0) {
      fullyAllocated.add(itemId)
    }
  })

  return fullyAllocated
})

// Build item quantity map from associations
const associatedItemQuantities = computed(() => {
  const quantityMap = new Map<string, number>()

  // Extract quantities from associations
  associations.value.forEach(assoc => {
    // Each association may have multiple child items with quantities
    if (assoc.itemQuantities && typeof assoc.itemQuantities === 'object') {
      Object.entries(assoc.itemQuantities).forEach(([itemId, quantity]) => {
        quantityMap.set(itemId, (quantityMap.get(itemId) || 0) + (quantity as number))
      })
    } else if (assoc.childContainerIds && Array.isArray(assoc.childContainerIds)) {
      // If no quantity data, assume 1 per item
      assoc.childContainerIds.forEach((id: string) => {
        quantityMap.set(id, (quantityMap.get(id) || 0) + 1)
      })
    }
  })

  return quantityMap
})

const viewingContainerActions = computed((): ConfigAction[] => {
  if (!viewingContainer.value) return []
  const config = getConfigForContainer(viewingContainer.value.type)
  if (!config) return []

  const sessionRole = sessionData.value?.user?.role
  const userRoles = sessionRole ? [{ id: 9090, name: sessionRole }] : []
  const detailActions = getDetailActionsFromConfig(config)

  return filterActionsByRoleAndLifecycle(detailActions, viewingContainer.value, userRoles)
})

const getContainerDetailActions = (container: Container): ConfigAction[] => {
  console.log(`[DEBUG getContainerDetailActions] START - Container ID: ${container.id}, Type: ${container.type}, Lifecycle: ${container.lifecycle}`)

  const config = getConfigForContainer(container.type)
  console.log(`[DEBUG getContainerDetailActions] Config found: ${!!config}`)

  if (!config) {
    console.log(`[DEBUG getContainerDetailActions] No config found for type ${container.type}, returning empty`)
    return []
  }

  console.log(`[DEBUG getContainerDetailActions] Config has actions: ${config.actions?.length || 0}`)

  const sessionRole = sessionData.value?.user?.role
  const userRoles = sessionRole
    ? [{ id: 9090, name: sessionRole }]
    : [{ id: 9090, name: 'Admin' }]

  const detailActions = getDetailActionsFromConfig(config)
  console.log(`[DEBUG getContainerDetailActions] After getDetailActionsFromConfig: ${detailActions.length} actions`)

  const filtered = filterActionsByRoleAndLifecycle(detailActions, container, userRoles)
  console.log(`[DEBUG getContainerDetailActions] After filtering: ${filtered.length} actions`)

  if (filtered.length > 0) {
    filtered.forEach(a => console.log(`[DEBUG getContainerDetailActions] Returning action: ${a.label} (${a.id})`))
  }

  return filtered
}

const selectedRelatedContainerItems = computed((): Container[] => {
  if (selectedRelatedContainers.value.size === 0) return []
  return relatedContainers.value.filter(container => selectedRelatedContainers.value.has(container.id))
})

const selectedRelatedCommonActions = computed((): ConfigAction[] => {
  const selectedItems = selectedRelatedContainerItems.value
  if (selectedItems.length === 0) return []

  const actionMaps = selectedItems.map(container => {
    const actions = getContainerDetailActions(container)
    return new Map(actions.map(action => [action.id, action]))
  })

  const [firstMap, ...restMaps] = actionMaps
  if (!firstMap) return []

  return Array.from(firstMap.values()).filter(action =>
    restMaps.every(actionMap => actionMap.has(action.id))
  )
})

// Get visible and hidden actions (2 visible, rest in dropdown)
const visibleActions = computed(() => {
  console.log('[DEBUG visibleActions] selectedRelatedContainers:', selectedRelatedContainers.value.size, 'selectedRelatedContainer:', selectedRelatedContainer.value?.id, 'viewingContainer:', viewingContainer.value?.id, 'selectedConfig:', selectedConfig.value?.type)

  if (selectedRelatedContainers.value.size > 0) {
    console.log('[DEBUG visibleActions] Multi-selected, returning common actions')
    return selectedRelatedCommonActions.value.slice(0, 2)
  }

  // If viewing a specific container instance, get actions from its config and filter by lifecycle/roles
  if (viewingContainer.value && !selectedRelatedContainer.value) {
    console.log('[DEBUG visibleActions] Viewing container, getting master actions')
    const config = getConfigForContainer(viewingContainer.value.type)
    const masterActions = getMasterActionsFromConfig(config)
    console.log('[DEBUG visibleActions] masterActions count:', masterActions.length)
    if (masterActions.length > 0) {
      // Get user roles from session (convert role string to array format for filter)
      const sessionRole = sessionData.value?.user?.role
      const userRoles = sessionRole
        ? [{ id: 9090, name: sessionRole }]
        : [{ id: 9090, name: 'Admin' }]
      const filteredActions = filterActionsByRoleAndLifecycle(masterActions, viewingContainer.value, userRoles)
      console.log('[DEBUG visibleActions] After filter:', filteredActions.length)
      return filteredActions.slice(0, 2)
    }
    return []
  }

  // If only config is selected (container type, no specific container), show actions from config
  if (selectedConfig.value && !viewingContainer.value) {
    console.log('[DEBUG visibleActions] Config selected, showing config masterActions')
    const masterActions = getMasterActionsFromConfig(selectedConfig.value)
    if (masterActions.length > 0) {
      return masterActions.slice(0, 2)
    }
  }

  console.log('[DEBUG visibleActions] No condition matched, returning empty')
  return []
})

const hiddenActions = computed(() => {
  if (selectedRelatedContainers.value.size > 0) {
    return selectedRelatedCommonActions.value.slice(2)
  }

  // If a related container is selected, show its actions
  if (selectedRelatedContainer.value?.actions) {
    return selectedRelatedContainer.value.actions.slice(2)
  }

  // If viewing a specific container instance, get actions from its config and filter by lifecycle/roles
  if (viewingContainer.value && !selectedRelatedContainer.value) {
    const config = getConfigForContainer(viewingContainer.value.type)
    const masterActions = getMasterActionsFromConfig(config)
    if (masterActions.length > 0) {
      // Get user roles from session (convert role string to array format for filter)
      const sessionRole = sessionData.value?.user?.role
      const userRoles = sessionRole
        ? [{ id: 9090, name: sessionRole }]
        : [{ id: 9090, name: 'Admin' }]
      const filteredActions = filterActionsByRoleAndLifecycle(masterActions, viewingContainer.value, userRoles)
      return filteredActions.slice(2)
    }
    return []
  }

  // If only config is selected (container type, no specific container), show actions from config
  if (selectedConfig.value && !viewingContainer.value) {
    if (selectedConfig.value.actions) {
      return selectedConfig.value.actions.slice(2)
    }
  }

  return []
})

const allActions = computed(() => {
  return [...visibleActions.value, ...hiddenActions.value]
})

// Helper functions
const toggleSelectRelatedContainer = (container: Container) => {
  console.log(`🔵 toggleSelectRelatedContainer called with:`, {
    id: container.id,
    name: container.label,
    type: container.type,
    isLeaf: isLeafRelatedContainer(container),
    currentlySelected: selectedRelatedContainers.value.has(container.id)
  })

  if (!isLeafRelatedContainer(container)) {
    console.log(`⚠️ Not a leaf container, returning early`)
    return
  }

  const isCurrentlySelected = selectedRelatedContainers.value.has(container.id)

  if (isCurrentlySelected) {
    selectedRelatedContainers.value.delete(container.id)
    console.log(`➖ Deselected item: ${container.id}`)
  } else {
    selectedRelatedContainers.value.add(container.id)
    console.log(`➕ Selected item: ${container.id}`)
  }

  // Trigger reactivity by creating a new Set
  selectedRelatedContainers.value = new Set(selectedRelatedContainers.value)
  console.log(`📊 Total selected: ${selectedRelatedContainers.value.size}`)

  // Don't auto-navigate when toggling checkbox selection
  // const selectedItems = selectedRelatedContainerItems.value
  // selectedRelatedContainer.value = selectedItems.length === 1 ? selectedItems[0] || null : null
}

const isRelatedContainerSelected = (container: Container): boolean => {
  return selectedRelatedContainers.value.has(container.id)
}

const isLeafRelatedContainer = (container: Container): boolean => {
  const config = getConfigForContainer(container.type)
  const isLeaf = !config || !config.canContain || config.canContain.length === 0
  console.log(`🍂 isLeafRelatedContainer('${container.type}'): ${isLeaf}`)
  return isLeaf
}

// Warehouse items selection functions
const toggleSelectWarehouseItem = (item: any) => {
  const itemKey = `${item.warehouseId}-${item.itemId}`
  if (selectedWarehouseItems.value.has(itemKey)) {
    selectedWarehouseItems.value.delete(itemKey)
    console.log(`➖ Deselected warehouse item: ${itemKey}`)
  } else {
    selectedWarehouseItems.value.add(itemKey)
    console.log(`➕ Selected warehouse item: ${itemKey}`)
  }
  // Trigger reactivity
  selectedWarehouseItems.value = new Set(selectedWarehouseItems.value)
  console.log(`📊 Total selected warehouse items: ${selectedWarehouseItems.value.size}`)
}

const isWarehouseItemSelected = (item: any): boolean => {
  return selectedWarehouseItems.value.has(`${item.warehouseId}-${item.itemId}`)
}

const clearWarehouseItemSelection = () => {
  selectedWarehouseItems.value.clear()
  selectedWarehouseItems.value = new Set(selectedWarehouseItems.value)
}

const clearPlannedItemsSelection = () => {
  selectedRelatedContainers.value.clear()
  selectedRelatedContainers.value = new Set(selectedRelatedContainers.value)
}

const handleRelatedContainerClick = async (container: Container) => {
  if (isLeafRelatedContainer(container)) {
    toggleSelectRelatedContainer(container)
    return
  }
  await viewRelatedContainers(container)
}

const isContainerCardSelected = (container: Container): boolean => {
  if (isRelatedContainerSelected(container)) return true
  if (selectedRelatedContainer.value?.id === container.id) return true
  if (viewingContainer.value?.id === container.id) return true
  return false
}

const handleContainerCardClick = async (container: Container) => {
  await viewRelatedContainers(container)
}

const fetchContainerHistory = async (containerId: string) => {
  historyLoading.value = true
  try {
    const response = await api<any>(`/api/emc/container-movement?containerId=${encodeURIComponent(containerId)}`)
    if (response?.success) {
      movementHistory.value = (response.data || []) as ContainerMovementRecord[]
    } else {
      movementHistory.value = []
      console.error('Movement history API error:', response?.error)
    }
  } catch (err) {
    movementHistory.value = []
    console.error('Movement history fetch error:', err)
  } finally {
    historyLoading.value = false
  }
}

const viewRelatedContainers = async (container: Container) => {
  console.log('👁️ Viewing container:', container.id, `Type: ${container.type}`)
  viewingContainer.value = container
  selectedRelatedContainer.value = null
  selectedRelatedContainers.value.clear()

  // Reset warehouse items when changing containers
  availableWarehouseItems.value = []
  availableTrolleys.value = []
  trolleyItemCounts.value.clear()
  console.log('   ✅ Reset warehouse items, trolleys, and trolley item counts')

  const promises = [
    fetchContainerHistory(container.id),
    fetchAssociations()
  ]

  // If viewing a warehouse, fetch all items available for that warehouse
  if (container.type === 'Warehouse') {
    console.log('📦 Loading warehouse items...')
    promises.push(fetchAllInvItems(container.id))
  }

  // If viewing a trolley, fetch warehouse items available for loading
  if (container.type === 'Trolley') {
    console.log('🚚 Loading warehouse inventory for trolley...')
    promises.push(fetchWarehouseItemsForTrolley())
  }

  // If viewing a flight, fetch available trolleys for loading
  if (container.type === 'Flight') {
    console.log('🚁 Loading available trolleys for flight...')
    promises.push(fetchAvailableTrolleysForFlight())
  }

  await Promise.all(promises)
  console.log('✅ All data loaded for', container.id)
  console.log('   Current availableWarehouseItems state:', availableWarehouseItems.value?.length || 0, 'items')

  // After associations are loaded, fetch item counts for planned trolleys
  if (container.type === 'Flight') {
    const trolleyIds = associations.value
      .flatMap((assoc: any) => assoc.childContainerIds || [])
      .filter((id: any) => {
        const container = containers.value.find((c: any) => c.id === id)
        return container?.type === 'Trolley'
      })

    if (trolleyIds.length > 0) {
      console.log(`🎯 Fetching item counts for ${trolleyIds.length} planned trolleys...`)
      await fetchTrolleyItemCounts(trolleyIds)
    }
  }
  if (availableWarehouseItems.value && availableWarehouseItems.value.length > 0) {
    console.log('   First item:', availableWarehouseItems.value[0])
  }
  console.log('   Current availableTrolleys state:', availableTrolleys.value?.length || 0, 'trolleys')
  if (availableTrolleys.value && availableTrolleys.value.length > 0) {
    console.log('   First trolley:', availableTrolleys.value[0])
  }
  console.log('   warehouseItemsLoading state:', warehouseItemsLoading.value)
  console.log('   trolleysLoading state:', trolleysLoading.value)
  console.log('   viewingContainer.type:', viewingContainer.value?.type)
}


// Fetch warehouse items available for trolley loading
const fetchWarehouseItemsForTrolley = async () => {
  try {
    console.log('\n🚚 [TROLLEY ITEMS] Starting warehouse items fetch...')
    console.log('   Current trolley:', viewingContainer.value?.id)
    console.log('   Current trolley type:', viewingContainer.value?.type)

    if (!viewingContainer.value || viewingContainer.value.type !== 'Trolley') {
      console.log('❌ Not viewing a trolley, aborting')
      availableWarehouseItems.value = []
      return
    }

    warehouseItemsLoading.value = true
    console.log('   ✅ Set loading flag to true')

    console.log('   📡 Calling API: /api/emc/inventory/warehouse-items')
    const response = await api<any>('/api/emc/inventory/warehouse-items')

    console.log('   📦 API Response received:')
    console.log('      - Type:', typeof response)
    console.log('      - Success:', response?.success)
    console.log('      - Data type:', Array.isArray(response?.data) ? 'Array' : typeof response?.data)
    console.log('      - Data length:', response?.data?.length)
    console.log('      - Full response:', response)

    if (response?.success && Array.isArray(response.data)) {
      console.log('   [BEFORE ASSIGNMENT] availableWarehouseItems.value length:', availableWarehouseItems.value.length)
      availableWarehouseItems.value = response.data
      console.log('   [AFTER ASSIGNMENT] availableWarehouseItems.value length:', availableWarehouseItems.value.length)
      console.log('   [AFTER ASSIGNMENT] Array contents:', availableWarehouseItems.value)
      console.log(`   ✅ Loaded ${response.data.length} warehouse items`)

      if (response.data.length > 0) {
        console.log('   📋 Sample items:')
        response.data.slice(0, 3).forEach((item: any, idx: number) => {
          console.log(`      [${idx + 1}] ${item.itemLabel} (${item.warehouseLabel}): ${item.quantityOnHand} units`)
        })
      }
    } else {
      console.log('   [CLEARING] Setting availableWarehouseItems to empty array')
      availableWarehouseItems.value = []
      console.log('   [AFTER CLEAR] availableWarehouseItems.value length:', availableWarehouseItems.value.length)
      console.warn('❌ API response error:')
      console.warn('   - Success flag:', response?.success)
      console.warn('   - Is array:', Array.isArray(response?.data))
      console.warn('   - Error:', response?.error)
      console.warn('   - Full response:', response)
    }
  } catch (err) {
    availableWarehouseItems.value = []
    console.error('❌ Error fetching warehouse items:')
    console.error('   Error object:', err)
    if (err instanceof Error) {
      console.error('   Message:', err.message)
      console.error('   Stack:', err.stack)
    }
  } finally {
    warehouseItemsLoading.value = false
    console.log(`ℹ️ Trolley loading complete. Items available: ${availableWarehouseItems.value.length}`)
    console.log('='.repeat(80))
  }
}

// Fetch available trolleys for flight loading
const fetchAvailableTrolleysForFlight = async () => {
  try {
    console.log('\n🚁 [FLIGHT TROLLEYS] Starting available trolleys fetch...')
    console.log('   Current flight:', viewingContainer.value?.id)
    console.log('   Current flight type:', viewingContainer.value?.type)

    if (!viewingContainer.value || viewingContainer.value.type !== 'Flight') {
      console.log('❌ Not viewing a flight, aborting')
      availableTrolleys.value = []
      return
    }

    trolleysLoading.value = true
    console.log('   ✅ Set loading flag to true')

    console.log('   📡 Calling API: /api/emc/inventory/available-trolleys')
    const response = await api<any>('/api/emc/inventory/available-trolleys')

    console.log('   📦 API Response received:')
    console.log('      - Type:', typeof response)
    console.log('      - Success:', response?.success)
    console.log('      - Data type:', Array.isArray(response?.data) ? 'Array' : typeof response?.data)
    console.log('      - Data length:', response?.data?.length)
    console.log('      - Full response:', response)

    if (response?.success && Array.isArray(response.data)) {
      console.log('   [BEFORE ASSIGNMENT] availableTrolleys.value length:', availableTrolleys.value.length)
      availableTrolleys.value = response.data
      console.log('   [AFTER ASSIGNMENT] availableTrolleys.value length:', availableTrolleys.value.length)
      console.log('   [AFTER ASSIGNMENT] Array contents:', availableTrolleys.value)
      console.log(`   ✅ Loaded ${response.data.length} available trolleys`)

      if (response.data.length > 0) {
        console.log('   📋 Sample trolleys:')
        response.data.slice(0, 3).forEach((trolley: any, idx: number) => {
          console.log(`      [${idx + 1}] ${trolley.trolleyLabel} (${trolley.status}): ${trolley.itemsCount} items`)
        })
      }
    } else {
      console.log('   [CLEARING] Setting availableTrolleys to empty array')
      availableTrolleys.value = []
      console.log('   [AFTER CLEAR] availableTrolleys.value length:', availableTrolleys.value.length)
      console.warn('❌ API response error:')
      console.warn('   - Success flag:', response?.success)
      console.warn('   - Is array:', Array.isArray(response?.data))
      console.warn('   - Error:', response?.error)
      console.warn('   - Full response:', response)
    }
  } catch (err) {
    availableTrolleys.value = []
    console.error('❌ Error fetching available trolleys:')
    console.error('   Error object:', err)
    if (err instanceof Error) {
      console.error('   Message:', err.message)
      console.error('   Stack:', err.stack)
    }
  } finally {
    trolleysLoading.value = false
    console.log(`ℹ️ Flight loading complete. Trolleys available: ${availableTrolleys.value.length}`)
    console.log('='.repeat(80))
  }
}

// Show dialog to select quantity for trolley loading
const showTrolleyLoadDialog = (item: any) => {
  trolleyLoadItem.value = item
  trolleyLoadQuantity.value = 0
  trolleyLoadDialog.value = true
}

// Transfer item from warehouse to trolley
const confirmTrolleyLoad = async () => {
  if (!trolleyLoadItem.value || !trolleyLoadQuantity.value || !viewingContainer.value) {
    snackbarMessage.value = 'Invalid quantity or item'
    snackbarColor.value = 'warning'
    snackbar.value = true
    return
  }

  const qty = parseInt(String(trolleyLoadQuantity.value))
  if (isNaN(qty) || qty <= 0 || qty > trolleyLoadItem.value.quantityOnHand) {
    snackbarMessage.value = `Quantity must be between 1 and ${trolleyLoadItem.value.quantityOnHand}`
    snackbarColor.value = 'error'
    snackbar.value = true
    return
  }

  trolleyLoadDialog.value = false
  isLoading.value = true

  try {
    const payload = {
      warehouseId: trolleyLoadItem.value.warehouseId,
      trolleyId: viewingContainer.value.id,
      itemId: trolleyLoadItem.value.itemId,
      quantity: qty,
      performedBy: 'Rahim Bhimani'
    }

    console.log('📦 Transferring inventory:', payload)

    const response = await api<any>('/api/emc/inventory/transfer', {
      method: 'POST',
      body: payload
    })

    console.log('Transfer response:', response)

    if (response?.success) {
      snackbarMessage.value = `Loaded ${qty} unit(s) to trolley`
      snackbarColor.value = 'success'
      snackbar.value = true

      // Refresh warehouse items list
      await fetchWarehouseItemsForTrolley()

      // Refresh inventory display
      await fetchWarehouseInventory()

      // Refresh associations to show items in Planned tab
      await fetchAssociations()

      trolleyLoadItem.value = null
      trolleyLoadQuantity.value = 0
    } else {
      throw new Error(response?.error || 'Transfer failed')
    }
  } catch (err) {
    snackbarMessage.value = err instanceof Error ? err.message : 'Failed to load items'
    snackbarColor.value = 'error'
    snackbar.value = true
    console.error('Transfer error:', err)
  } finally {
    isLoading.value = false
  }
}

// Show dialog to load trolley to flight
const showFlightLoadDialog = (trolley: any) => {
  flightLoadTrolley.value = trolley
  flightLoadDialog.value = true
}

// Transfer trolley from available pool to flight
const confirmFlightLoad = async () => {
  if (!flightLoadTrolley.value || !viewingContainer.value) {
    snackbarMessage.value = 'Invalid trolley or flight selection'
    snackbarColor.value = 'warning'
    snackbar.value = true
    return
  }

  flightLoadDialog.value = false
  isLoading.value = true

  try {
    const payload = {
      flightId: viewingContainer.value.id,
      trolleyId: flightLoadTrolley.value.trolleyId,
      performedBy: 'Rahim Bhimani'
    }

    console.log('🚁 Transferring trolley to flight:', payload)

    const response = await api<any>('/api/emc/inventory/trolley-transfer', {
      method: 'POST',
      body: payload
    })

    console.log('Transfer response:', response)

    if (response?.success) {
      snackbarMessage.value = `Loaded trolley to flight successfully`
      snackbarColor.value = 'success'
      snackbar.value = true

      // Refresh available trolleys list
      await fetchAvailableTrolleysForFlight()

      // Refresh associations to show trolleys in Planned tab
      await fetchAssociations()

      flightLoadTrolley.value = null
    } else {
      throw new Error(response?.error || 'Transfer failed')
    }
  } catch (err) {
    snackbarMessage.value = err instanceof Error ? err.message : 'Failed to load trolley'
    snackbarColor.value = 'error'
    snackbar.value = true
    console.error('Transfer error:', err)
  } finally {
    isLoading.value = false
  }
}

const backToContainers = () => {
  viewingContainer.value = null
  selectedRelatedContainer.value = null
  selectedRelatedContainers.value.clear()
}

const closeDetails = () => {
  viewingContainer.value = null
  selectedRelatedContainer.value = null
  selectedRelatedContainers.value.clear()
}

const backToConfigs = () => {
  selectedConfig.value = null
  viewingContainer.value = null
  selectedRelatedContainer.value = null
  selectedRelatedContainers.value.clear()
  searchQuery.value = ''
  filterByLifecycle.value = ''
}

const getTypeImage = (type: string): string => {
  const images: Record<string, string> = {
    Warehouse: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
    ULD: 'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b',
    Item: 'https://images.unsplash.com/photo-1588872657378-c92197cc60db',
    default: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d'
  }
  return (images[type] || images['default']) as string
}

const getLifecycleColor = (lifecycle: string): string => {
  const colors: Record<string, string> = {
    DRAFT: 'warning',
    READY: 'success',
    ACTIVE: 'secondary',
    CLOSED: 'primary',
    ARCHIVED: 'grey'
  }
  return colors[lifecycle] || 'grey'
}

const trolleyItemCounts = ref<Map<string, number>>(new Map())

// Fetch item counts for planned trolleys
const fetchTrolleyItemCounts = async (trolleyIds: string[]) => {
  if (!trolleyIds || trolleyIds.length === 0) return

  try {
    console.log(`📦 Fetching item counts for ${trolleyIds.length} trolleys...`)

    // For each trolley, fetch its associations to count items
    for (const trolleyId of trolleyIds) {
      try {
        const response = await api<any>(`/api/emc/container-associations?parentContainerId=${trolleyId}`)
        if (response?.success && response.data) {
          const itemCount = response.data.reduce((total: number, assoc: any) =>
            total + (assoc.childContainerIds?.length || 0), 0)
          trolleyItemCounts.value.set(trolleyId, itemCount)
          console.log(`   - ${trolleyId}: ${itemCount} items`)
        }
      } catch (err) {
        console.warn(`Failed to fetch items for trolley ${trolleyId}:`, err)
        trolleyItemCounts.value.set(trolleyId, 0)
      }
    }

    console.log(`✅ Trolley item counts updated`)
  } catch (err) {
    console.error('Error fetching trolley item counts:', err)
  }
}

// Get item count for a specific container (trolley, flight, etc.)
const getContainerItemCount = (containerId: string): number => {
  // Check cached trolley item counts
  if (trolleyItemCounts.value.has(containerId)) {
    return trolleyItemCounts.value.get(containerId) || 0
  }

  // Check if the container has an itemsCount property
  if (plannedContainers.value) {
    const containerFromList = plannedContainers.value.find((c: any) => c.id === containerId)
    if (containerFromList?.itemsCount) {
      return containerFromList.itemsCount
    }
  }

  return 0
}

const isActionEnabled = (action: ConfigAction): boolean => {
  if (selectedRelatedContainers.value.size > 0) {
    return selectedRelatedCommonActions.value.some(commonAction => commonAction.id === action.id)
  }

  // If a related container is selected, check precondition against it
  if (selectedRelatedContainer.value) {
    if (action.precondition?.lifecycle) {
      return action.precondition.lifecycle.includes(selectedRelatedContainer.value.lifecycle)
    }
    return true
  }

  // If viewing a container (master actions), enable by default
  if (viewingContainer.value && !selectedRelatedContainer.value) {
    return true
  }

  // If only config is selected (master actions at config level), enable by default
  if (selectedConfig.value && !viewingContainer.value) {
    return true
  }

  return false
}

const getDisabledReason = (action: ConfigAction | ContainerAction): string => {
  if (selectedRelatedContainers.value.size > 0) {
    const isCommonAction = selectedRelatedCommonActions.value.some(commonAction => commonAction.id === action.id)
    if (!isCommonAction) {
      return 'Action is not available for all selected containers'
    }
    return ''
  }

  // If a related container is selected, check precondition against it
  if (selectedRelatedContainer.value) {
    if (action.precondition?.lifecycle) {
      if (!action.precondition.lifecycle.includes(selectedRelatedContainer.value.lifecycle)) {
        return `Requires status: ${action.precondition.lifecycle.join(', ')}`
      }
    }
    return ''
  }

  // If viewing a container (master actions from config), they're always enabled
  if (viewingContainer.value && !selectedRelatedContainer.value) {
    return ''
  }

  // If only config is selected (master actions at config level), they're always enabled
  if (selectedConfig.value && !viewingContainer.value) {
    return ''
  }

  return 'No selection'
}

const handleAction = async (action: ConfigAction | ContainerAction, containerFromMenu?: any) => {
  console.log('=== Menu Action Triggered ===')
  console.log('Action:', action)
  console.log('Container from menu:', containerFromMenu)

  // If action is triggered from container menu, auto-select that container
  if (containerFromMenu) {
    console.log('Auto-selecting container:', containerFromMenu.id)
    selectedRelatedContainers.value.add(containerFromMenu.id)
    console.log('Selected containers after add:', Array.from(selectedRelatedContainers.value))
  }

  const container = viewingContainer.value
  console.log('Viewing (parent) container:', container)

  if (!container) {
    snackbarMessage.value = 'Please select a container to perform this action'
    snackbarColor.value = 'warning'
    snackbar.value = true
    return
  }

  // Determine action type based on action label
  const actionLabel = action.id.toLowerCase()
  console.log('Action label (lowercase):', actionLabel)

  // Handle different action types
  if (actionLabel.includes('move') || actionLabel.includes('attach')) {
    // MOVE/ATTACH: Requires selected child containers
    // First, validate that parent container can perform this action based on its lifecycle
    const parentAction = viewingContainerActions.value.find(a => a.id === action.id)
    if (parentAction?.precondition?.lifecycle && !parentAction.precondition.lifecycle.includes(container.lifecycle)) {
      snackbarMessage.value = `Cannot attach: Trolley must be in ${parentAction.precondition.lifecycle.join(' or ')} status, currently in ${container.lifecycle}`
      snackbarColor.value = 'error'
      snackbar.value = true
      return
    }

    const childIds = Array.from(selectedRelatedContainers.value)
    console.log('Child IDs to move:', childIds)

    if (childIds.length === 0) {
      snackbarMessage.value = 'Please select at least one container to move'
      snackbarColor.value = 'warning'
      snackbar.value = true
      return
    }

    // For each item being attached, show quantity dialog
    for (const childId of childIds) {
      // For warehouses, look in planningContainers (inventory items)
      // For other containers, look in relatedContainers
      let childItem = container.type === 'Warehouse'
        ? planningContainers.value.find(c => c.id === childId)
        : relatedContainers.value.find(c => c.id === childId)

      // Fallback to the other list if not found
      if (!childItem) {
        childItem = relatedContainers.value.find(c => c.id === childId)
      }
      if (!childItem && container.type === 'Warehouse') {
        childItem = planningContainers.value.find(c => c.id === childId)
      }

      if (childItem) {
        console.log('📦 Found child item for quantity dialog:', childItem.id, childItem.label || childItem.name)
        selectedItemForQuantity.value = childItem
        inputQuantity.value = 0

        // Show dialog and wait for confirmation
        await new Promise<void>((resolve) => {
          const checkDialog = setInterval(() => {
            if (!showQuantityDialog.value) {
              clearInterval(checkDialog)
              resolve()
            }
          }, 100)
          showQuantityDialog.value = true
        })
      } else {
        console.log('❌ Child item not found:', childId)
      }
    }

    return // Will be called from confirmQuantityAndAttach
  } else if (actionLabel === 'detach') {
    // DETACH: Remove selected containers from parent
    const childIds = Array.from(selectedRelatedContainers.value)

    if (childIds.length === 0) {
      snackbarMessage.value = 'Please select at least one container to detach'
      snackbarColor.value = 'warning'
      snackbar.value = true
      return
    }

    isLoading.value = true
    error.value = null

    try {
      // Process detach for each selected container
      for (const childId of childIds) {
        const payload = {
          parentContainerId: container.id,
          childContainerId: childId,
          organizationId: container.organizationId || 'default'
        }

        console.log('Detaching container:', payload)

        const response = await api<any>('/api/emc/container-remove', {
          method: 'POST',
          body: payload
        })

        if (!response?.success) {
          throw new Error(response?.error || `Failed to detach container ${childId}`)
        }
      }

      console.log(`Successfully detached ${childIds.length} container(s)`)
      snackbarMessage.value = `Successfully detached ${childIds.length} container(s)`
      snackbarColor.value = 'success'
      snackbar.value = true

      selectedRelatedContainer.value = null
      selectedRelatedContainers.value.clear()

      await fetchContainers()
      await fetchContainerHistory(container.id)
      await fetchAssociations()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to detach container'
      snackbarMessage.value = error.value
      snackbarColor.value = 'error'
      snackbar.value = true
      console.error('Error:', err)
    } finally {
      isLoading.value = false
    }
  } else if (actionLabel.includes('close') || actionLabel.includes('complete')) {
    // CLOSE: Move parent ACTIVE -> CLOSED and close ACTIVE children
    isLoading.value = true
    error.value = null

    try {
      const payload = {
        containerId: container.id,
        organizationId: container.organizationId || 'default'
      }

      console.log('Closing container:', payload)

      const response = await api<any>('/api/emc/container-complete', {
        method: 'POST',
        body: payload
      })

      if (response?.success) {
        console.log('Container closed successfully:', response.data)
        snackbarMessage.value = 'Container closed successfully'
        snackbarColor.value = 'success'
        snackbar.value = true

        selectedRelatedContainer.value = null
        selectedRelatedContainers.value.clear()

        await fetchContainers()
        await fetchContainerHistory(container.id)
      } else {
        throw new Error(response?.error || 'Failed to close container')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to close container'
      snackbarMessage.value = error.value
      snackbarColor.value = 'error'
      snackbar.value = true
      console.error('Error:', err)
    } finally {
      isLoading.value = false
    }
  } else if (actionLabel.includes('activate')) {
    isLoading.value = true
    error.value = null

    try {
      const payload = {
        containerId: container.id,
        organizationId: container.organizationId || 'default'
      }

      const response = await api<any>('/api/emc/container-activate', {
        method: 'POST',
        body: payload
      })

      if (response?.success) {
        snackbarMessage.value = 'Container activated successfully'
        snackbarColor.value = 'success'
        snackbar.value = true

        await fetchContainers()
        await fetchContainerHistory(container.id)
      } else {
        throw new Error(response?.error || 'Failed to activate container')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to activate container'
      snackbarMessage.value = error.value
      snackbarColor.value = 'error'
      snackbar.value = true
    } finally {
      isLoading.value = false
    }
  } else if (actionLabel.includes('reopen')) {
    isLoading.value = true
    error.value = null

    try {
      const payload = {
        containerId: container.id,
        organizationId: container.organizationId || 'default'
      }

      const response = await api<any>('/api/emc/container-reopen', {
        method: 'POST',
        body: payload
      })

      if (response?.success) {
        snackbarMessage.value = 'Container reopened successfully'
        snackbarColor.value = 'success'
        snackbar.value = true

        await fetchContainers()
        await fetchContainerHistory(container.id)
      } else {
        throw new Error(response?.error || 'Failed to reopen container')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reopen container'
      snackbarMessage.value = error.value
      snackbarColor.value = 'error'
      snackbar.value = true
    } finally {
      isLoading.value = false
    }
  } else if (actionLabel.includes('archive')) {
    // ARCHIVE: Archive container and all descendants
    isLoading.value = true
    error.value = null

    try {
      const payload = {
        containerId: container.id,
        organizationId: container.organizationId || 'default'
      }

      console.log('Archiving container:', payload)

      const response = await api<any>('/api/emc/container-archive', {
        method: 'POST',
        body: payload
      })

      if (response?.success) {
        console.log('Container archived successfully:', response.data)
        snackbarMessage.value = 'Container archived successfully'
        snackbarColor.value = 'success'
        snackbar.value = true

        selectedRelatedContainer.value = null
        selectedRelatedContainers.value.clear()
        viewingContainer.value = null

        await fetchContainers()
      } else {
        throw new Error(response?.error || 'Failed to archive container')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to archive container'
      snackbarMessage.value = error.value
      snackbarColor.value = 'error'
      snackbar.value = true
      console.error('Error:', err)
    } finally {
      isLoading.value = false
    }
  } else {
    // Unknown action
    snackbarMessage.value = `Action "${action.label}" is not implemented yet`
    snackbarColor.value = 'warning'
    snackbar.value = true
  }
}

const flattenTypeData = (data: Record<string, any>, prefix = ''): Record<string, any> => {
  const result: Record<string, any> = {}

  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) return

    if (typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenTypeData(value, `${prefix}${key}.`))
    } else {
      result[`${prefix}${key}`] = value
    }
  })

  return result
}

const formatLabel = (label: string): string => {
  return label
    .split('.')
    .pop()
    ?.replace(/([A-Z])/g, ' $1')
    .trim() || label
}

const confirmQuantityAndAttach = async () => {
  if (!selectedItemForQuantity.value || !inputQuantity.value || !viewingContainer.value) {
    snackbarMessage.value = 'Invalid quantity selection'
    snackbarColor.value = 'warning'
    snackbar.value = true
    return
  }

  showQuantityDialog.value = false
  isLoading.value = true
  error.value = null

  try {
    const childId = selectedItemForQuantity.value.id
    const quantity = inputQuantity.value

    console.log(`📦 Receiving ${childId} with quantity: ${quantity}`)

    const payload = {
      actionId: 'ATTACH',
      actionLabel: 'Attach',
      parentContainerId: viewingContainer.value.id,
      parentContainerType: viewingContainer.value.type,
      childContainerIds: [childId],
      quantity: quantity, // Include quantity in payload
      organizationId: viewingContainer.value.organizationId || 'default'
    }

    console.log('Sending API payload:', payload)
    const response = await api<any>('/api/emc/container-associations', {
      method: 'POST',
      body: payload
    })

    console.log('API Response:', response)
    console.log('Response success:', response?.success)

    if (response?.success) {
      console.log('Item received successfully:', response.data)

      snackbarMessage.value = `Successfully received ${quantity} unit(s)`
      snackbarColor.value = 'success'
      snackbar.value = true

      await fetchContainers()
      await fetchContainerHistory(viewingContainer.value.id)
      await fetchAssociations()
      await fetchAllInvItems(viewingContainer.value.id)

      // Fetch inventory data for all planned items so counts display
      await fetchWarehouseInventory()

      // Clear selection
      selectedRelatedContainers.value.clear()
      selectedRelatedContainer.value = null
      selectedItemForQuantity.value = null
      inputQuantity.value = 0
    } else {
      throw new Error(response?.error || 'Failed to create association')
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to attach item'
    snackbarMessage.value = error.value
    snackbarColor.value = 'error'
    snackbar.value = true
    console.error('Error:', err)
  } finally {
    isLoading.value = false
  }
}

const formatValue = (value: any): string => {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const formatDateTime = (value?: string): string => {
  if (!value) return 'N/A'
  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return value
  return dt.toLocaleString()
}

// Utility actions
const openAudit = () => {
  console.log('Open audit for:', viewingContainer.value?.id)
  // TODO: Implement audit view
}

const exportExcel = () => {
  console.log('Export to Excel:', viewingContainer.value?.id)
  // TODO: Implement Excel export
}

const exportCSV = () => {
  console.log('Export to CSV:', viewingContainer.value?.id)
  // TODO: Implement CSV export
}

const exportPDF = () => {
  console.log('Export to PDF:', viewingContainer.value?.id)
  // TODO: Implement PDF export
}

const importExcel = () => {
  console.log('Import from Excel')
  // TODO: Implement Excel import
}

const importCSV = () => {
  console.log('Import from CSV')
  // TODO: Implement CSV import
}

const refreshData = async () => {
  await fetchContainers()
  if (viewingContainer.value) {
    await fetchContainerHistory(viewingContainer.value.id)
  }
}

// Get responsive button size
const getButtonSize = (desktop = 'x-small') => {
  return desktop
}
</script>

<style scoped>
.airbnb-card {
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.airbnb-card:hover {
  transform: translateY(-4px);
}

.airbnb-card-container {
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.airbnb-card-container:hover {
  transform: scale(1.03);
}

.container-card-selected {
  border: 2px solid rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), 0.06);
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.18), 0 6px 18px rgba(var(--v-theme-primary), 0.18) !important;
}

.rounded-top-xl {
  border-start-end-radius: 20px;
  border-start-start-radius: 20px;
}

.rounded-top-lg {
  border-start-end-radius: 14px;
  border-start-start-radius: 14px;
}

.gap-2 {
  gap: 8px;
}

.airbnb-card.h-100 .v-card__text,
.airbnb-card-container.h-100 .v-card__text {
  flex: 1;
}

/* Text truncation */
.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Grid spacing for split panel */
.pr-2 {
  padding-inline-end: 8px;
}

.pl-1 {
  padding-inline-start: 4px;
}
</style>
