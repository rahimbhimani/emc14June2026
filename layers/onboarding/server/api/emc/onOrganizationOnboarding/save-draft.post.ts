import connectDB from '@/utils/db'
import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'

const draftSchema = z.object({
  admin: z.object({
    email: z.string().email(),
  }),
})

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

  let onboardingReference =
    body.onboardingReference

  const now = new Date()

  // ====================================
  // NEW DRAFT
  // ====================================

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

      currentStep:
        body.currentStep ?? 0,

      administratorEmail:
        form.admin.email,

      organizationName:
        form.org?.organizationName ?? '',

      data: form,

      createdDate: now,
      updatedDate: now,
      lastSavedDate: now,
    })

    // TODO:
    // Queue email here

    return {
      success: true,

      onboardingReference,

      isNew: true,

      message:
        'Draft saved successfully',
    }
  }

  // ====================================
  // UPDATE EXISTING
  // ====================================

  await onboardingCollection.updateOne(
    {
      onboardingReference,
    },
    {
      $set: {
        currentStep:
          body.currentStep ?? 0,

        administratorEmail:
          form.admin.email,

        organizationName:
          form.org?.organizationName ?? '',

        data: form,

        updatedDate: now,
        lastSavedDate: now,
      },
    },
  )

  return {
    success: true,

    onboardingReference,

    isNew: false,

    message:
      'Draft updated successfully',
  }
})
