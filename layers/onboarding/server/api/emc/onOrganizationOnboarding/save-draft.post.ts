import connectDB from '@/utils/db'
import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'

import { generateOnboardingReference } from '../../../utils/emcGenerateOnboardingReference'

import { trackEntityChange } from '~/layers/shared/server/utils/emcTrackEntityChange'

const draftSchema = z.object({
  admin: z.object({
    email: z.string().email(),
  }),
})

function normalize(value: string = '') {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
}

export default defineEventHandler(async event => {
  const body = await readBody(event)

  const form = body.form

  if (!form) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Form data missing',
    })
  }

  const validation =
    draftSchema.safeParse(form)

  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Administrator email is required',
    })
  }

  const db = await connectDB()

  const onboardingCollection =
    db.collection('emcOnboarding')

  const emailQueueCollection =
    db.collection('emcEmailQueue')

  let onboardingReference =
    body.onboardingReference

  const now = new Date()

  const organizationName =
    form.org?.organizationName ?? ''

  const legalName =
    form.org?.legalName ?? ''

  const administratorEmail =
    form.admin?.email ?? ''

  // =====================================================
  // CREATE NEW DRAFT
  // =====================================================

  if (!onboardingReference) {
    let exists = true

    while (exists) {
      onboardingReference =
        generateOnboardingReference()

      exists =
        (await onboardingCollection.countDocuments({
          onboardingReference,
        })) > 0
    }

    await onboardingCollection.insertOne({
      onboardingReference,

      status: 'Draft',

      version: 1,

      currentStep:
        body.currentStep ?? 0,

      administratorEmail,

      organizationName,

      organizationNameNormalized:
        normalize(organizationName),

      legalName,

      isReferenceEmailSent: false,

      referenceEmailSentDate: null,

      data: form,

      createdDate: now,
      updatedDate: now,
      lastSavedDate: now,
    })

    await emailQueueCollection.insertOne({
      type: 'ONBOARDING_DRAFT',

      to: administratorEmail,

      onboardingReference,

      status: 'Pending',

      retries: 0,

      createdDate: now,
      updatedDate: now,
    })

    await trackEntityChange({
      module: 'Onboarding',

      entityType: 'Onboarding',

      entityId:
        onboardingReference,

      action:
        'DRAFT_CREATED',

      performedBy:
        administratorEmail,

      details: {
        organizationName,
        legalName,
      },
    })

    return {
      success: true,

      onboardingReference,

      isNew: true,

      message:
        'Draft saved successfully',
    }
  }

  // =====================================================
  // LOAD EXISTING DRAFT
  // =====================================================

  const existing =
    await onboardingCollection.findOne({
      onboardingReference,
      administratorEmail,
    })

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage:
        'Draft not found',
    })
  }

  // =====================================================
  // UPDATE DRAFT
  // =====================================================

  const updateResult =
    await onboardingCollection.updateOne(
      {
        onboardingReference,
        administratorEmail,
      },
      {
        $set: {
          currentStep:
            body.currentStep ?? 0,

          organizationName,

          organizationNameNormalized:
            normalize(organizationName),

          legalName,

          data: form,

          updatedDate: now,
          lastSavedDate: now,
        },

        $inc: {
          version: 1,
        },
      },
    )

  if (!updateResult.matchedCount) {
    throw createError({
      statusCode: 404,
      statusMessage:
        'Draft not found',
    })
  }
  console.log('before track change ')
  await trackEntityChange({
    module: 'Onboarding',

    entityType: 'Onboarding',

    entityId:
      onboardingReference,

    action:
      'DRAFT_UPDATED',

    performedBy:
      administratorEmail,

    oldData:
      existing.data,

    newData:
      form,

    version:
      (existing.version || 0) + 1,

    details: {
      currentStep:
        body.currentStep ?? 0,
    },
  })

  return {
    success: true,

    onboardingReference,

    isNew: false,

    message:
      'Draft updated successfully',
  }
})
