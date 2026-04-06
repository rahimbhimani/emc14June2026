export default defineEventHandler(async (event) => {
  try {
    // Check if mongodb package is available
    const { MongoClient, ObjectId } = await import('mongodb').catch(() => {
      throw new Error('MongoDB package not installed. Run: npm install mongodb')
    })
    
    const config = useRuntimeConfig()
    
    // Get MongoDB connection string from runtime config or environment
    const mongoUri = config.mongodbUri || process.env.MONGODB_URI || 'mongodb://localhost:27017'
    const dbName = 'EMC' // Database name
    const variantCollectionName = 'emcInvItemVariant' // Variant collection
    const itemCollectionName = 'emcInvItem' // Master item collection
    
    console.log('=== Items API Called ===')
    console.log('MongoDB URI:', mongoUri)
    console.log('Database:', dbName)
    console.log('Variant Collection:', variantCollectionName)
    console.log('Master Collection:', itemCollectionName)
    
    let client: any = null

    try {
      // Connect to MongoDB
      client = new MongoClient(mongoUri)
      await client.connect()
      console.log('MongoDB connected successfully')
      
      const database = client.db(dbName)
      const variantsCollection = database.collection(variantCollectionName)
      const itemsCollection = database.collection(itemCollectionName)
      
      // Get query parameters for filtering
      const query = getQuery(event)
      const searchTerm = query.search as string | undefined
      const category = query.category as string | undefined
      const stockStatus = query.stockStatus as string | undefined
      
      console.log('Query params:', { searchTerm, category, stockStatus })
      
      // Build MongoDB query for variants
      const variantFilter: any = {}
      
      // By default, only show in-stock variants
      if (!stockStatus || stockStatus === 'In Stock') {
        variantFilter['gbVariant.InStock'] = true
      } else if (stockStatus === 'Out of Stock') {
        variantFilter['gbVariant.InStock'] = { $ne: true }
      }
      
      console.log('Variant filter:', JSON.stringify(variantFilter))
      
      // Fetch variants from MongoDB
      const variants = await variantsCollection
        .find(variantFilter)
        .sort({ 'gbVariant.VariantName': 1 })
        .limit(200)
        .toArray()
      
      console.log(`Found ${variants.length} variants`)
      
      // Only proceed if variants exist
      if (variants.length === 0) {
        console.log('No variants found in database')
        return {
          success: true,
          data: [],
          count: 0,
          message: 'No variants found. Please ensure emcInvItemVariant collection has data.',
        }
      }
      
      // Get unique master item IDs
      const masterItemIds = [...new Set(variants.map((v: any) => v.gbVariant?.MasterItemId).filter(Boolean))]
      
      // Fetch master items
      const masterItems = await itemsCollection
        .find({ _id: { $in: masterItemIds.map(id => new ObjectId(id)) } })
        .toArray()
      
      // Create a map of master items
      const masterItemsMap = new Map(masterItems.map(item => [item._id.toString(), item]))
      
      console.log(`Found ${masterItems.length} master items`)
      
      // Transform variants with master item data
      const transformedVariants = variants.map((variant: any) => {
        const gbVariant = variant.gbVariant
        const masterItemId = gbVariant?.MasterItemId
        const masterItem = masterItemId ? masterItemsMap.get(masterItemId) : null
        const gbItem = masterItem?.gbItem
        const manufacturer = masterItem?.gbManufacturer?.tbInvCompany?.tbsManuDtls
        
        // Use variant name or master item name
        const variantName = gbVariant?.VariantName || gbItem?.ItemName || gbItem?.Name || 'N/A'
        const masterName = gbItem?.ItemName || gbItem?.Name || 'N/A'
        
        // Determine stock status
        const inStock = gbVariant?.InStock === true
        const currentStock = gbVariant?.CurrentStock || 0
        
        // Apply search filter if needed
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase()
          const matchesSearch = 
            variantName.toLowerCase().includes(searchLower) ||
            masterName.toLowerCase().includes(searchLower) ||
            (gbItem?.ItemSKU || '').toLowerCase().includes(searchLower) ||
            (gbVariant?.VariantSKU || '').toLowerCase().includes(searchLower) ||
            (gbItem?.barcodedata || '').toLowerCase().includes(searchLower) ||
            (gbVariant?.Barcode || '').toLowerCase().includes(searchLower) ||
            (manufacturer?.ManufactureName || '').toLowerCase().includes(searchLower)
          
          if (!matchesSearch) return null
        }
        
        // Apply category filter if needed
        const itemCategory = gbItem?.CategoryType?.title || 'Uncategorized'
        if (category && itemCategory !== category) {
          return null
        }
        
        return {
          id: variant._id.toString(),
          variantId: variant._id.toString(),
          masterItemId: masterItemId || null,
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
          // Include variant-specific details
          variantDetails: {
            size: gbVariant?.Size,
            color: gbVariant?.Color,
            weight: gbVariant?.Weight,
          },
          // Include full original data for reference
          _original: {
            variant: variant,
            masterItem: masterItem,
          }
        }
      }).filter(Boolean) // Remove null entries from filtering
      
      console.log('Returning variants:', transformedVariants.length)
      if (transformedVariants.length > 0) {
        console.log('Sample transformed variant:', transformedVariants[0])
      }
      
      return {
        success: true,
        data: transformedVariants,
        count: transformedVariants.length,
      }
    } catch (error) {
      console.error('Error fetching items from MongoDB:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        data: [],
        count: 0,
      }
    } finally {
      // Close MongoDB connection
      if (client) {
        await client.close()
        console.log('MongoDB connection closed')
      }
    }
  } catch (error) {
    console.error('Fatal error in items API:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      data: [],
      count: 0,
    }
  }
})
