<script setup lang="ts">
import { useScreenDesignStore } from '@/store/screenDesignStore'

const { resolveComponent } = useComponentRegistry()
const screenDesignStore = useScreenDesignStore()

const props = defineProps({
  groupObject: {
    type: Object,
  },
  parentId: {
    type: String,
    default: '',
  },
})

function getControlsInOrder(controls) {
  if (!Array.isArray(controls)) return []

  return controls
    .map(control => {
      const orderProperty = control.controlProperties?.find(
        prop => prop.propertyTitle === 'Order'
      )

      return {
        ...control,
        Order: Number(orderProperty?.data ?? 0)
      }
    })
    .sort((a, b) => a.Order - b.Order)
}

// computed so Vue tracks array mutations and Order property changes reactively
const sortedControls = computed(() => getControlsInOrder(props.groupObject))

function getCols(vObject) {
  let lObj

  lObj = vObject.controlProperties.filter(e => e.propertyTitle === 'Cols')[0]

  return lObj.ChangedBy === '' || lObj.ChangedBy === undefined ? lObj.Defaultvalue : lObj.data
}

// --- Drag state ---
// draggedId: id of the control being dragged
// dropIndex: insertion point (0..sortedControls.length).
//   dropIndex=0 means "before the first control",
//   dropIndex=N means "after the last control",
//   dropIndex=i means "before the control currently at position i".
const draggedId = ref(null)
const dropIndex = ref(null)

function onHandleMouseDown(event, controlId) {
  event.preventDefault()
  event.stopPropagation()
  draggedId.value = controlId
  document.body.style.cursor = 'grabbing'

  // --- Ghost element that follows the cursor ---
  const dragItemEl = event.currentTarget.parentElement
  let ghost = null
  if (dragItemEl) {
    const rect = dragItemEl.getBoundingClientRect()
    ghost = dragItemEl.cloneNode(true)
    ghost.style.position = 'fixed'
    ghost.style.pointerEvents = 'none'
    ghost.style.zIndex = '9999'
    ghost.style.opacity = '0.7'
    ghost.style.width = rect.width + 'px'
    ghost.style.maxHeight = '60px'
    ghost.style.overflow = 'hidden'
    ghost.style.background = 'white'
    ghost.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)'
    ghost.style.borderRadius = '4px'
    ghost.style.left = (event.clientX - 20) + 'px'
    ghost.style.top = (event.clientY - 10) + 'px'
    ghost.style.transform = 'rotate(1deg)'
    document.body.appendChild(ghost)
  }

  // 2D insertion index for flex-wrap layouts (horizontal cols<12 and vertical cols=12).
  // Uses the control's TOP edge (not midY) to detect "cursor is above this row",
  // then X-position within same-row controls, and midY for full-width stacked controls.
  function getInsertIdx(ex: number, ey: number): number {
    const controls = sortedControls.value
    const rects = controls.map(c => {
      const el = document.querySelector(`[data-control-id="${c.id}"]`)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return r.height === 0 && r.width === 0 ? null : r
    })

    for (let i = 0; i < controls.length; i++) {
      const r = rects[i]
      if (!r) continue
      const midX = (r.left + r.right) / 2
      const midY = (r.top + r.bottom) / 2

      // Cursor is clearly above this control's row → insert before it
      if (ey < r.top) return i

      if (ey <= r.bottom) {
        // Cursor is within this control's row.
        const prevR = i > 0 ? rects[i - 1] : null
        const nextR = i < rects.length - 1 ? rects[i + 1] : null
        const rowThreshold = r.height * 0.5
        const hasSameRowNeighbour =
          (prevR !== null && Math.abs(prevR.top - r.top) < rowThreshold) ||
          (nextR !== null && Math.abs(nextR.top - r.top) < rowThreshold)

        if (hasSameRowNeighbour) {
          // Horizontal layout: use X to find position within the row
          if (ex < midX) return i
          // cursor is right of this control's centre → continue to next
        } else {
          // Full-width / stacked vertical: use midY to split upper vs lower half
          if (ey < midY) return i
          // cursor is in lower half → continue to next
        }
      }
      // cursor is below this control → continue
    }
    return controls.length
  }

  function onMouseMove(e) {
    if (ghost) {
      ghost.style.left = (e.clientX - 20) + 'px'
      ghost.style.top = (e.clientY - 10) + 'px'
    }
    dropIndex.value = getInsertIdx(e.clientX, e.clientY)
  }

  function onMouseUp(e: MouseEvent) {
    document.body.style.cursor = ''
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)

    // Recompute insertion index from the ACTUAL mouseup cursor position.
    const insertAt = getInsertIdx(e.clientX, e.clientY)

    if (ghost) { document.body.removeChild(ghost); ghost = null }

    const controls = sortedControls.value
    const fromIdx = draggedId.value ? controls.findIndex(c => c.id === draggedId.value) : -1

    // After removing the dragged item from fromIdx, every index above it shifts down by 1.
    // Compensate so the visual insertion gap maps to the correct final array position.
    const adjustedInsert = insertAt > fromIdx ? insertAt - 1 : insertAt

    console.log(
      '[mouseup] dragged:', draggedId.value?.slice(0, 8),
      '| fromIdx:', fromIdx,
      '| insertAt:', insertAt,
      '| adjustedInsert:', adjustedInsert,
      '| parentId:', props.parentId?.slice(0, 8),
      '| controls:', controls.length,
    )

    if (fromIdx !== -1 && insertAt !== -1 && adjustedInsert !== fromIdx) {
      const reordered = [...controls]
      const [moved] = reordered.splice(fromIdx, 1)
      reordered.splice(adjustedInsert, 0, moved)
      console.log('[mouseup] new order:', reordered.map(c => c.ControlName))
      screenDesignStore.reorderControls(props.parentId, reordered.map(c => c.id))
    }

    draggedId.value = null
    dropIndex.value = null
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
</script>

<template>
  <!-- Insertion indicator BEFORE the first control (dropIndex === 0) -->
  <div
    v-if="draggedId !== null && dropIndex === 0"
    class="drop-indicator"
  />

  <template v-for="(control, idx) in sortedControls" :key="control.id">
    <VCol v-if="control.controlProperties?.some(p => p.propertyTitle === 'StartOnNextLine' && p.data === 'true')"
      style="flex-basis: 100%; padding: 0; block-size: 0;" />
    <VDivider
      v-if="control.controlProperties?.some(p => p.propertyTitle === 'HorizontalLineBefore' && p.data === 'true')"
      :thickness="2" class="border-opacity-75 mt-1 mb-1" style="border-color: silver;" />
    <VCol :cols="getCols(control)" class="pl-0 ml-0">
      <div
        class="drag-item"
        :data-control-id="control.id"
        :class="{ 'dragging': draggedId === control.id }"
      >
        <div
          class="drag-handle-area"
          @mousedown.prevent.stop="onHandleMouseDown($event, control.id)"
        >
          <VIcon icon="mdi:drag-vertical" size="16" class="drag-handle" />
        </div>
        <div class="drag-content">
          <component :is="resolveComponent(control.controlType, true)" :group-object="control" type="control.Datatype"
            v-bind="control.vbind" />
        </div>
      </div>
    </VCol>

    <!-- Insertion indicator AFTER this control (dropIndex === idx + 1) -->
    <div
      v-if="draggedId !== null && dropIndex === idx + 1"
      class="drop-indicator"
    />
  </template>
</template>

<style>
.drag-item {
  display: flex;
  align-items: flex-start;
  cursor: default;
  gap: 4px;
  transition: opacity 0.1s;
}

.drag-item.dragging {
  opacity: 0.35;
}

/* Blue insertion-point line that spans the full row */
.drop-indicator {
  flex-basis: 100%;
  block-size: 3px;
  background-color: #5865f2;
  border-radius: 2px;
  margin-block: 1px;
  pointer-events: none;
}

.drag-handle-area {
  flex-shrink: 0;
  cursor: grab;
  padding-block-start: 4px;
  padding-inline: 2px;
  pointer-events: auto;
  touch-action: none;
  user-select: none;
}

.drag-handle {
  display: block;
  color: #aaa;
}

.drag-content {
  flex: 1;
  min-inline-size: 0;
}

.flex-container {
  display: flex;
  flex-flow: row wrap;
  justify-content: left !important;
}

.wrap {
  flex-wrap: wrap;
}

.v-toolbar__content {
  block-size: 50px;
}

.flex-item {
  position: relative;
  box-sizing: border-box;
  flex: auto;
  flex-basis: 10%;
  inline-size: 100%;
}
</style>
