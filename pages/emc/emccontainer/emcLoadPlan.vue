<script setup lang="ts">
import { ref } from 'vue';

// Sample data
const flightId = ref('ACME1911001');
const selectedSegment = ref('LSGG');

const segments = ref([
    { code: 'LSGG', date: '22 Nov 1/23', status: 'active', color: 'yellow' },
    { code: 'LGGF', date: '22 Nov 1/23', status: 'active', color: 'success' },
    { code: 'LFMN', date: '22 Nov 1/23', status: 'active', color: 'purple' },
]);

const flightSegments = ref([
    { name: 'EDDF', status: 'Planned', date: '22 Nov 1/23' },
    { name: 'LFMN', status: 'Planned', date: '22 Nov 1/23' },
]);

const view = ref('Deck');
const aircraftType = ref('Airbus A300-600');
const maxWeight = ref(4500.000);
const buyRate = ref(4500.000);

const payloadItems = ref([
    { id: 'PLR23355', weight: 4800, status: 'LFMN', color: 'purple' },
    { id: 'PLR23355', weight: 4800, status: 'LGGF', color: 'success' },
    { id: 'PLR23355', weight: 4800, status: 'LFMN', color: 'purple' },
    { id: 'PLR23355', weight: 17000, status: 'LGGF', color: 'success' },
    { id: 'PLR23355', weight: 4800, status: 'LFMN', color: 'purple' },
]);

const searchFilter = ref('');
const tableHeaders = [
    { title: 'AWB No', key: 'awbNo' },
    { title: 'Pkg', key: 'pkg' },
    { title: 'Pcs', key: 'pcs' },
    { title: 'Package', key: 'package' },
    { title: 'PLR23355', key: 'plr' },
    { title: 'Origin', key: 'origin' },
    { title: 'Dest', key: 'dest' },
    { title: 'Priority/Type', key: 'priority' },
    { title: 'Is Aval @ LCL', key: 'isAvail' },
    { title: 'Actual Pces In LCL', key: 'actualPcs' },
    { title: 'Loaded Pieces', key: 'loadedPcs' },
    { title: 'Flight No', key: 'flightNo' },
    { title: 'Flight Date', key: 'flightDate' },
    { title: 'CJ No', key: 'cjNo' },
    { title: 'Sort e-mails', key: 'sortEmails' },
];

const tableItems = ref([
    {
        awbNo: '8-88006143',
        pkg: 'SH',
        pcs: 'PLR23355',
        package: '',
        plr: '',
        origin: 'ACME19000',
        dest: '',
        priority: '',
        isAvail: '',
        actualPcs: 'u Aval 10/14',
        loadedPcs: '12 Nov 12/4',
        flightNo: '',
        flightDate: '',
        cjNo: '',
        sortEmails: '',
        status: 'LSGG',
        color: 'yellow',
    },
    {
        awbNo: '8-88006143',
        pkg: 'SH',
        pcs: 'PLR23355',
        package: '',
        plr: '',
        origin: 'ACME19000',
        dest: '',
        priority: '',
        isAvail: '',
        actualPcs: 'u Aval 10/14',
        loadedPcs: '12 Nov 12/4',
        flightNo: '',
        flightDate: '',
        cjNo: '',
        sortEmails: '',
        status: 'LSGG',
        color: 'purple',
    },
    {
        awbNo: '8-88006143',
        pkg: 'SH',
        pcs: 'PLR23355',
        package: '',
        plr: '',
        origin: 'ACME19000',
        dest: '',
        priority: '',
        isAvail: '',
        actualPcs: 'u Aval 10/14',
        loadedPcs: '12 Nov 12/4',
        flightNo: '',
        flightDate: '',
        cjNo: '',
        sortEmails: '',
        status: 'LSGG',
        color: 'yellow',
    },
]);

// Container grid data (aircraft layout)
const containerGrid = ref([
    // Row 1
    [
        { id: 'A1', status: 'LGGF', color: 'cyan', span: 1 },
        { id: 'A2', status: 'LGGF', color: 'cyan', span: 1 },
        { id: 'A3', status: '', color: '', span: 1 },
        { id: 'A4', status: 'LGGF', color: 'cyan', span: 1 },
    ],
    // Row 2
    [
        { id: 'B1', status: 'LGGF', color: 'cyan', span: 1 },
        { id: 'B2', status: '', color: '', span: 1 },
        { id: 'B3', status: '', color: '', span: 1 },
        { id: 'B4', status: '', color: '', span: 1 },
    ],
    // Row 3 (large orange container)
    [
        { id: 'C1', status: 'LSGG', color: 'orange', span: 2 },
        { id: '', status: '', color: '', span: 0 },
        { id: 'C3', status: '', color: '', span: 1 },
        { id: 'C4', status: '', color: '', span: 1 },
    ],
    // Row 4
    [
        { id: 'D1', status: 'LGGF', color: 'cyan', span: 1 },
        { id: 'D2', status: '', color: '', span: 1 },
        { id: 'D3', status: '', color: '', span: 1 },
        { id: 'D4', status: '', color: '', span: 1 },
    ],
    // Row 5
    [
        { id: 'E1', status: 'LGGF', color: 'cyan', span: 1 },
        { id: 'E2', status: 'LGGF', color: 'cyan', span: 1 },
        { id: 'E3', status: '', color: '', span: 1 },
        { id: 'E4', status: '', color: '', span: 1 },
    ],
]);
</script>

<template>
    <VRow class="load-plan-container">
        <!-- Left Sidebar -->
        <VCol cols="2" class="left-sidebar pa-0">
            <VCard flat class="h-100">
                <!-- Flight Header -->
                <VCardText class="pa-4">
                    <div class="d-flex align-center mb-2">
                        <VIcon size="20" class="me-2">mdi:airplane</VIcon>
                        <span class="text-subtitle-2 font-weight-medium">Cargo</span>
                    </div>
                    <div class="flight-id text-h6 font-weight-bold mb-3">
                        {{ flightId }}
                    </div>

                    <!-- Segment Badges -->
                    <div class="d-flex gap-2 mb-6">
                        <VChip v-for="seg in segments" :key="seg.code" :color="seg.color" size="small" label
                            class="font-weight-medium">
                            {{ seg.code }}
                        </VChip>
                    </div>

                    <!-- Flight Segments List -->
                    <div class="segments-list">
                        <div v-for="segment in flightSegments" :key="segment.name"
                            class="segment-item pa-3 mb-2 rounded cursor-pointer"
                            :class="{ 'segment-active': selectedSegment === segment.name }">
                            <div class="font-weight-medium">{{ segment.name }}</div>
                            <div class="text-caption text-medium-emphasis">
                                {{ segment.status }}
                            </div>
                            <div class="text-caption text-medium-emphasis">
                                {{ segment.date }}
                            </div>
                        </div>
                    </div>
                </VCardText>
            </VCard>
        </VCol>

        <!-- Main Content Area -->
        <VCol cols="7" class="main-content pa-4">
            <!-- Load Plan Section -->
            <VCard flat class="mb-4">
                <VCardText>
                    <!-- Header Controls -->
                    <div class="d-flex justify-space-between align-center mb-4">
                        <div>
                            <div class="text-h6 font-weight-bold mb-1">Load Plan</div>
                            <div class="d-flex gap-2">
                                <VChip size="small" variant="outlined">Deck</VChip>
                                <VChip size="small" variant="outlined">Main</VChip>
                            </div>
                        </div>

                        <!-- Action Icons -->
                        <div class="d-flex gap-2">
                            <VBtn icon size="small" variant="text">
                                <VIcon>mdi:plus</VIcon>
                            </VBtn>
                            <VBtn icon size="small" variant="text">
                                <VIcon>mdi:map-marker</VIcon>
                            </VBtn>
                            <VBtn icon size="small" variant="text">
                                <VIcon>mdi:cog</VIcon>
                            </VBtn>
                            <VBtn icon size="small" variant="text">
                                <VIcon>mdi:download</VIcon>
                            </VBtn>
                            <VBtn icon size="small" variant="text">
                                <VIcon>mdi:printer</VIcon>
                            </VBtn>
                            <VBtn icon size="small" variant="text">
                                <VIcon>mdi:refresh</VIcon>
                            </VBtn>
                            <VBtn icon size="small" variant="text">
                                <VIcon>mdi:dots-horizontal</VIcon>
                            </VBtn>
                        </div>
                    </div>

                    <!-- Aircraft Visualization -->
                    <div class="aircraft-container pa-6 rounded-lg position-relative">
                        <!-- Aircraft Type Label -->
                        <div class="aircraft-label text-center mb-4 text-medium-emphasis">
                            {{ aircraftType }}
                        </div>

                        <!-- Aircraft Outline SVG Background -->
                        <div class="aircraft-outline">
                            <!-- Container Grid -->
                            <div class="container-grid">
                                <div v-for="(row, rowIndex) in containerGrid" :key="rowIndex"
                                    class="grid-row d-flex gap-2 mb-2">
                                    <template v-for="(cell, cellIndex) in row" :key="cellIndex">
                                        <div v-if="cell.span > 0" class="grid-cell rounded" :class="{
                                            'cell-cyan': cell.color === 'cyan',
                                            'cell-orange': cell.color === 'orange',
                                            'cell-empty': !cell.status,
                                            'cell-large': cell.span === 2,
                                        }">
                                            <span v-if="cell.id" class="cell-label">{{
                                                cell.id
                                                }}</span>
                                        </div>
                                    </template>
                                </div>
                            </div>
                        </div>

                        <!-- ZFW Label -->
                        <div class="zfw-label text-end mt-4">
                            <div class="text-caption text-medium-emphasis">ZFW</div>
                            <div class="text-caption text-medium-emphasis">Cup</div>
                            <div class="text-caption text-medium-emphasis">Tiny</div>
                        </div>
                    </div>

                    <!-- View Options -->
                    <div class="mt-4">
                        <div class="text-subtitle-2 font-weight-medium mb-2">Views</div>
                        <div class="d-flex gap-2">
                            <VBtn size="small" variant="tonal" prepend-icon="mdi:airplane">
                                Deck
                            </VBtn>
                            <VBtn size="small" variant="outlined">Offloaded cargo query</VBtn>
                            <VBtn size="small" variant="outlined">Cargo Parameters</VBtn>
                            <VBtn size="small" variant="outlined">Load Report in LGG</VBtn>
                            <VBtn size="small" variant="outlined">Upload Pieces</VBtn>
                        </div>
                    </div>
                </VCardText>
            </VCard>

            <!-- Search and Table Section -->
            <VCard flat>
                <VCardText>
                    <div class="d-flex align-center gap-2 mb-4">
                        <VIcon>mdi:filter</VIcon>
                        <span class="font-weight-medium">Search Filter</span>
                    </div>

                    <!-- Data Table -->
                    <VTable density="compact" class="load-plan-table">
                        <thead>
                            <tr>
                                <th v-for="header in tableHeaders" :key="header.key" class="text-start text-caption">
                                    {{ header.title }}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(item, index) in tableItems" :key="index">
                                <td>{{ item.awbNo }}</td>
                                <td>{{ item.pkg }}</td>
                                <td>
                                    <VChip v-if="item.pcs" size="x-small" :color="item.color" label>
                                        {{ item.pcs }}
                                    </VChip>
                                </td>
                                <td>{{ item.package }}</td>
                                <td>
                                    <VChip v-if="item.status" size="x-small" :color="item.color" label>
                                        {{ item.status }}
                                    </VChip>
                                </td>
                                <td>{{ item.origin }}</td>
                                <td>{{ item.dest }}</td>
                                <td>{{ item.priority }}</td>
                                <td>{{ item.isAvail }}</td>
                                <td>{{ item.actualPcs }}</td>
                                <td>{{ item.loadedPcs }}</td>
                                <td>{{ item.flightNo }}</td>
                                <td>{{ item.flightDate }}</td>
                                <td>{{ item.cjNo }}</td>
                                <td>{{ item.sortEmails }}</td>
                            </tr>
                        </tbody>
                    </VTable>
                </VCardText>
            </VCard>
        </VCol>

        <!-- Right Sidebar - Payload -->
        <VCol cols="3" class="right-sidebar pa-4">
            <VCard flat class="h-100">
                <VCardText>
                    <div class="d-flex justify-space-between align-center mb-4">
                        <div class="text-h6 font-weight-bold">Payload</div>
                        <VBtn icon size="small" variant="text">
                            <VIcon>mdi:filter</VIcon>
                        </VBtn>
                    </div>

                    <!-- Weight Summary -->
                    <div class="weight-summary mb-4 pa-3 rounded bg-surface-variant">
                        <div class="d-flex justify-space-between mb-2">
                            <span class="text-caption">Max</span>
                            <span class="font-weight-medium">{{ maxWeight }}</span>
                        </div>
                        <div class="d-flex justify-space-between">
                            <span class="text-caption">Buy Rate</span>
                            <span class="font-weight-medium">{{ buyRate }}</span>
                        </div>
                    </div>

                    <!-- Flight Status Dropdown -->
                    <VSelect density="compact" :items="['Planned']" model-value="Planned" variant="outlined"
                        class="mb-4" />

                    <!-- Payload Items List -->
                    <div class="payload-list">
                        <div v-for="(item, index) in payloadItems" :key="index"
                            class="payload-item d-flex align-center justify-space-between pa-3 mb-2 rounded">
                            <div class="d-flex align-center gap-2">
                                <VIcon size="16">mdi:package-variant</VIcon>
                                <div>
                                    <div class="text-caption font-weight-medium">
                                        {{ item.id }}
                                    </div>
                                    <div class="text-caption text-medium-emphasis">
                                        {{ item.weight }}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <VChip size="x-small" :color="item.color" label>
                                    {{ item.status }}
                                </VChip>
                                <VBtn icon size="x-small" variant="text">
                                    <VIcon size="16">mdi:dots-horizontal</VIcon>
                                </VBtn>
                            </div>
                        </div>
                    </div>
                </VCardText>
            </VCard>
        </VCol>
    </VRow>
</template>

<style scoped lang="scss">
.load-plan-container {
    margin: 0;
    background-color: rgb(var(--v-theme-surface));
    block-size: 100vh;
}

.left-sidebar {
    background-color: rgb(var(--v-theme-surface));
    border-inline-end: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.segment-item {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    transition: all 0.2s;

    &:hover {
        background-color: rgba(var(--v-theme-primary), 0.08);
    }

    &.segment-active {
        border-color: rgb(var(--v-theme-primary));
        background-color: rgba(var(--v-theme-primary), 0.12);
    }
}

.aircraft-container {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    background:
        linear-gradient(135deg,
            rgba(var(--v-theme-surface-variant), 0.3),
            rgba(var(--v-theme-surface-variant), 0.1));
    min-block-size: 400px;
}

.aircraft-outline {
    position: relative;
    padding: 2rem;
}

.container-grid {
    margin-block: 0;
    margin-inline: auto;
    max-inline-size: 500px;
}

.grid-row {
    justify-content: center;
}

.grid-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
    background-color: rgb(var(--v-theme-surface));
    block-size: 60px;
    font-size: 0.75rem;
    font-weight: 500;
    inline-size: 80px;
    transition: all 0.2s;

    &.cell-large {
        inline-size: 170px;
    }

    &.cell-cyan {
        border-color: #4fc3f7;
        background-color: #b3e5fc;
    }

    &.cell-orange {
        border-color: #ff9800;
        background-color: #ffb74d;
    }

    &.cell-empty {
        border-style: dashed;
        background-color: rgb(var(--v-theme-surface));
        opacity: 0.5;
    }

    &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 10%);
        transform: scale(1.05);
    }
}

.cell-label {
    font-size: 0.7rem;
    font-weight: 600;
}

.payload-item {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    background-color: rgb(var(--v-theme-surface));

    &:hover {
        background-color: rgba(var(--v-theme-surface-variant), 0.5);
    }
}

.load-plan-table {
    :deep(th) {
        background-color: rgba(var(--v-theme-surface-variant), 0.5);
        font-weight: 600 !important;
    }

    :deep(td) {
        font-size: 0.75rem;
    }
}

.weight-summary {
    font-size: 0.875rem;
}

.zfw-label {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-end: 1rem;
    transform: translateY(-50%);
}
</style>
