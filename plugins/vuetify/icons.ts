import { h } from 'vue'
import type { IconAliases, IconProps } from 'vuetify'

/* eslint-disable regex/invalid */
import { default as checkboxChecked, default as companyLogo } from '@images/svg/checkbox-checked.svg'
import checkboxIndeterminate from '@images/svg/checkbox-indeterminate.svg'
import checkboxUnchecked from '@images/svg/checkbox-unchecked.svg'
import radioChecked from '@images/svg/radio-checked.svg'
import radioUnchecked from '@images/svg/radio-unchecked.svg'

const customIcons: Record<string, any> = {
  'mdi-checkbox-blank-outline': checkboxUnchecked,
  'mdi-checkbox-marked': checkboxChecked,
  'mdi-minus-box': checkboxIndeterminate,
  'mdi-radiobox-marked': radioChecked,
  'mdi-radiobox-blank': radioUnchecked,
}

export const aliases: Partial<IconAliases> = {
  info: 'ri-error-warning-line',
  success: 'ri-checkbox-circle-line',
  warning: 'ri-alert-line',
  error: 'ri-error-warning-line',
  calendar: 'ri-calendar-2-line',
  collapse: 'ri-arrow-up-s-line',
  complete: 'ri-check-line',
  cancel: 'ri-close-line',
  close: 'ri-close-line',
  delete: 'ri-close-circle-fill',
  clear: 'ri-close-line',
  prev: 'ri-arrow-left-s-line',
  next: 'ri-arrow-right-s-line',
  delimiter: 'ri-circle-line',
  sort: 'ri-arrow-up-line',
  expand: 'ri-arrow-down-s-line',
  menu: 'ri-menu-line',
  subgroup: 'ri-arrow-down-s-fill',
  dropdown: 'ri-arrow-down-s-line',
  edit: 'ri-pencil-line',
  ratingEmpty: 'ri-star-line',
  ratingFull: 'ri-star-fill',
  ratingHalf: 'ri-star-half-line',
  loading: 'ri-refresh-line',
  first: 'ri-skip-back-mini-line',
  last: 'ri-skip-forward-mini-line',
  unfold: 'ri-split-cells-vertical',
  file: 'ri-attachment-2',
  plus: 'ri-add-line',
  minus: 'ri-subtract-line',
  sortAsc: 'ri-arrow-up-line',
  sortDesc: 'ri-arrow-down-line',
  play: 'ri-play-line',
  pause: 'ri-pause-line',
  fullscreen: 'ri-fullscreen-line',
  fullscreenExit: 'ri-fullscreen-exit-line',
  volumeHigh: 'ri-volume-up-line',
  volumeMedium: 'ri-volume-down-line',
  volumeLow: 'ri-volume-down-line',
  volumeOff: 'ri-volume-mute-line',
  tableGroupExpand: 'ri-arrow-right-s-line',
  tableGroupCollapse: 'ri-arrow-down-s-line',

  // 🔹 EMC aliases
    emcAdd: 'ri-add-fill',
    emcDelete: 'ri-delete-bin-line', // Example alias,
    emcSave:'ri-save-3-line',
    emcEdit:'ri-file-edit-line',
    emcList:'ri-file-list-line',
    emcAlert:'ri-alert-line',
    emcFilter:'ri-filter-line',
    emcFilteroff:'ri-filter-off-line',
    emcUndo:'ri-arrow-left-circle-line',
    emcCompanyLogo: companyLogo,
}
/* eslint-enable */

export const iconify = {
  component: (props: IconProps) => {
    // 1️⃣ SVG icons (checkbox, radio, etc.)
    if (typeof props.icon === 'string' && customIcons[props.icon]) {
      return h(customIcons[props.icon])
    }

    // 2️⃣ 🔑 ALIAS RESOLUTION (THIS FIXES emcadd)
    const resolvedIcon =
      typeof props.icon === 'string' && aliases[props.icon]
        ? aliases[props.icon]
        : props.icon

    // 3️⃣ Handle image URLs or paths (jpg, png, gif, svg, webp, etc.)
    if (typeof resolvedIcon === 'string' && /\.(jpg|jpeg|png|gif|svg|webp|bmp|ico)$/i.test(resolvedIcon)) {
      return h('img', {
        src: resolvedIcon,
        alt: props.icon as string,
        style: {
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        },
      })
    }

    // 4️⃣ Handle iconify icons with mdi: prefix
    if (typeof resolvedIcon === 'string' && resolvedIcon.startsWith('mdi:')) {
      const iconName = resolvedIcon.replace('mdi:', 'mdi-')
      return h(
        props.tag ?? 'i',
        {
          class: `mdi ${iconName}`,
        },
      )
    }

    // 5️⃣ Render class-based icon (ri-*)
    return h(
      props.tag ?? 'i',
      {
        class: resolvedIcon,
      },
    )
  },
}

export const icons = {
  defaultSet: 'iconify',
  aliases,
  sets: {
    iconify,
  },
}
