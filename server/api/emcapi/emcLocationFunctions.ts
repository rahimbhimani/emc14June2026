// /server/api/search.js
import connectDB from '~/utils/db'

export default defineEventHandler(async (event) => {
  
  const cntrlID = getQuery(event).cntrlID?.trim()
  const frmid = getQuery(event).frm?.trim()
  
  if (!cntrlID || !frmid) return 'incorrect query parameters'

  const cn = await connectDB()

  const collectionMaster = cn.collection('emcFormDesign')
  let cursor = collectionMaster.find({'FormParameters.Name': 'emcRate', 'FormRTObjects.Controls.id': 'e170fdae-e1dc-46ed-953b-9de9e3db6e8a'})
  cursor = await cursor.toArray()
  return cursor



  const controlConfig = await db.collection('emcFormControls')
    // .findOne({ formId: frmid, controlId: cntrlID })

  if (!controlConfig) return `no control configuration found for formId: ${frmid}, controlId: ${cntrlID}`

  return controlConfig

  const results = []


  if (types.includes('Airport')) {
    const airports = await db.collection('emcAirportMaster')
      .find({ $or: [{ code: regex }, { name: regex }, { city: regex }] })
      .limit(10).toArray()
    results.push(...airports.map(a => ({
      type: 'Airport',
      value: a.code,
      label: `${a.code} – ${a.name} (${a.city}, ${a.country})`
    })))
  }

  if (types.includes('City')) {
    const cities = await db.collection('cities')
      .find({ name: regex }).limit(10).toArray()
    results.push(...cities.map(c => ({
      type: 'City',
      value: c.name,
      label: `${c.name} (${c.country})`
    })))
  }

  if (types.includes('Country')) {
    const countries = await db.collection('countries')
      .find({ name: regex }).limit(10).toArray()
    results.push(...countries.map(c => ({
      type: 'Country',
      value: c.name,
      label: c.name
    })))
  }

  if (types.includes('Group')) {
    const groups = await db.collection('groups')
      .find({ name: regex }).limit(10).toArray()
    results.push(...groups.map(g => ({
      type: 'Group',
      value: g._id,
      label: `${g.name} [Group]`
    })))
  }

  return results
})
