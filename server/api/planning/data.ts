export default defineEventHandler(async (event) => {
    try {
        // Check if mongodb package is available
        const { MongoClient } = await import('mongodb').catch(() => {
            throw new Error('MongoDB package not installed. Run: npm install mongodb')
        })

        const config = useRuntimeConfig()
        const mongoUri = config.mongodbUri || process.env.MONGODB_URI || 'mongodb://localhost:27017'
        const dbName = 'EMC'

        console.log('=== Unified Planning Data API Called ===')
        console.log('MongoDB URI:', mongoUri)

        let client: any = null

        try {
            client = new MongoClient(mongoUri)
            await client.connect()
            console.log('MongoDB connected successfully')

            const database = client.db(dbName)

            // Fetch flights
            console.log('Fetching flights...')
            const flightsCollection = database.collection('emcFlight')
            const flightsData = await flightsCollection.find({}).toArray()

            // Transform flights data
            const flights = flightsData.map((f: any) => ({
                id: f._id?.toString() || '',
                flightNo: f.tbFlightInfo?.tbBasicDetails?.FlightNumber || '',
                route: f.tbFlightInfo?.tbBasicDetails?.gbRoute?.Origin?.title + ' - ' + f.tbFlightInfo?.tbBasicDetails?.gbRoute?.Destination?.title || '',
                departure: f.tbFlightInfo?.tbBasicDetails?.gbRoute?.Origin?.title || '',
                aircraft: f.tbFlightInfo?.tbBasicDetails?.Aircraft || '',
                flightDate: f.tbFlightInfo?.tbBasicDetails?.FlightDate || '',
                status: f.status || 'Available'
            }))
            console.log('Flights loaded:', flights.length)

            // Fetch trolleys
            console.log('Fetching trolleys...')
            const trolleysCollection = database.collection('emcTrolley')
            const trolleysData = await trolleysCollection.find({}).toArray()

            // Transform trolleys data using correct nested structure
            const trolleys = trolleysData.map((t: any) => {
                const tbMain = t.tbTrolley?.tbMain
                const code = tbMain?.Name || tbMain?.IDX || 'N/A'
                const type = tbMain?.ColumnName?.title || 'Standard'
                const location = tbMain?.Location?.title || 'Unknown'
                const capacity = tbMain?.Capacity || 120
                const status = t.status || 'READY'

                return {
                    id: t._id?.toString() || '',
                    code: code,
                    type: type,
                    capacity: capacity,
                    status: status,
                    location: location,
                    manufactureYear: tbMain?.ManufactureYear || 'N/A',
                    flight: t.flight || '',
                    destination: t.destination || ''
                }
            })
            console.log('Trolleys loaded:', trolleys.length)

            // Fetch items
            console.log('Fetching items...')
            const { ObjectId } = await import('mongodb')
            const variantsCollection = database.collection('emcInvItemVariant')
            const masterItemsCollection = database.collection('emcInvItem')

            const variantsData = await variantsCollection
                .find({ 'gbVariant.InStock': true })
                .limit(200)
                .toArray()

            console.log('Variants loaded:', variantsData.length)

            if (variantsData.length === 0) {
                console.log('No variants found in database')
                var items: any[] = []
            } else {
                // Get unique master item IDs
                const masterItemIds = [...new Set(variantsData.map((v: any) => v.gbVariant?.MasterItemId).filter(Boolean))]

                // Fetch master items
                const masterItems = await masterItemsCollection
                    .find({ _id: { $in: masterItemIds.map(id => new ObjectId(id)) } })
                    .toArray()

                // Create a map of master items
                const masterItemsMap = new Map(masterItems.map(item => [item._id.toString(), item]))

                console.log('Master items loaded:', masterItems.length)

                // Transform variants with master item data
                var items = variantsData.map((variant: any) => {
                    const gbVariant = variant.gbVariant
                    const masterItemId = gbVariant?.MasterItemId
                    const masterItem = masterItemId ? masterItemsMap.get(masterItemId) : null
                    const gbItem = masterItem?.gbItem
                    const manufacturer = masterItem?.gbManufacturer?.tbInvCompany?.tbsManuDtls

                    const variantName = gbVariant?.VariantName || gbItem?.ItemName || gbItem?.Name || 'N/A'
                    const masterName = gbItem?.ItemName || gbItem?.Name || 'N/A'
                    const inStock = gbVariant?.InStock === true
                    const currentStock = gbVariant?.CurrentStock || 0
                    const itemCategory = gbItem?.CategoryType?.title || 'Uncategorized'

                    return {
                        id: variant._id.toString(),
                        variantId: variant._id.toString(),
                        masterItemId: masterItemId || '',
                        sku: gbVariant?.VariantSKU || gbItem?.ItemSKU || 'N/A',
                        name: variantName,
                        masterName: masterName,
                        category: itemCategory,
                        uom: gbItem?.UOM?.title || 'N/A',
                        barcode: gbVariant?.Barcode || gbItem?.barcodedata || 'N/A',
                        manufacturer: manufacturer?.ManufactureName || 'N/A',
                        image: masterItem?.gbImage?.Image || variant.gbImage?.Image || null,
                        stockStatus: inStock ? 'In Stock' : 'Out of Stock',
                        currentStock: currentStock,
                        loadingStatus: gbVariant?.LoadingStatus || 'Available',
                        variantDetails: {
                            size: gbVariant?.Size || '',
                            color: gbVariant?.Color || '',
                            weight: gbVariant?.Weight || ''
                        }
                    }
                })
            }
            // Fetch trolley loading status
            console.log('Fetching trolley loading status...')
            const trolleyItemCollection = database.collection('emcTrolleyItem')
            const trolleyItems = await trolleyItemCollection.find({}).toArray()

            const trolleyLoadingStatus: Record<string, number> = {}
            trolleyItems.forEach((ti: any) => {
                const trolleyId = ti.trolleyId || ti.TrolleyId || ''
                if (trolleyId) {
                    if (!trolleyLoadingStatus[trolleyId]) {
                        trolleyLoadingStatus[trolleyId] = 0
                    }
                    trolleyLoadingStatus[trolleyId] += ti.items?.length || 0
                }
            })
            console.log('Trolley loading status:', Object.keys(trolleyLoadingStatus).length, 'trolleys have items')

            return {
                success: true,
                data: {
                    flights,
                    trolleys,
                    items,
                    trolleyLoadingStatus
                }
            }

        } catch (error) {
            console.error('MongoDB error:', error)
            throw error
        } finally {
            if (client) {
                await client.close()
                console.log('MongoDB connection closed')
            }
        }

    } catch (error) {
        console.error('Planning data API error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch planning data'
        }
    }
})
