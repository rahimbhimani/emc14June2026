import connectDB from '@/utils/db';
import { defineEventHandler, readMultipartFormData } from 'h3';
import mongoose from 'mongoose';
import { isRef } from 'vue';
import { processBinaryDataAccurate } from '~/server/api/utils/emcBinary/emcBinaryProcessor';
import { getRequestType } from '~/server/utils/emcgetrequesttype';
import { addemcFormDesign } from '~/utils/emcFormDesignManagement';

let cn: any;
let mDTObject: any;

import { createError } from 'h3';
import { generateId } from '~/server/services/emc/emcIdGenerator';
import { getUserFromEvent } from '~/server/utils/auth';

let currentUser = null;
export async function getDataFromEvent(event: any) {
  const reqType = getRequestType(event)
  // console.log('✅ Request Type:', reqType)
  currentUser = await getUserFromEvent(event);
  // ✅ MULTIPART
  if (reqType === 'multipart') {
    const form = await readMultipartFormData(event)
    // console.log('✅ Multipart form data received:', form)

    if (!form) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No multipart data',
      })
    }

    // ✅ JSON PART
    const jsonPart = form.find(x => x.name === 'data')
    const retbody = jsonPart?.data
      ? JSON.parse(jsonPart.data.toString())
      : {}

    // ✅ FILES & META PARTS
    const filePartsRaw = form.filter(x => x.name === 'BinaryFile')
    const pathParts = form.filter(x => x.name === 'BinaryDataPath')
    const typeParts = form.filter(x => x.name === 'Type')

    // ✅ RECONSTRUCT FILE META (order-based)
    const files = filePartsRaw.map((f, i) => ({
      index: i,
      filename: f.filename,
      mimetype: f.type,
      size: f.data?.length || 0,
      datapath: pathParts[i]?.data?.toString() || '',
      metaType: typeParts[i]?.data?.toString() || '',
    }))

    // 🔑 THIS IS THE MISSING LINK
    // 🔑 Align with processBinaryDataAccurate contract
    retbody.BinaryData = files.map(f => ({
      datapath: f.datapath,
      Type: f.metaType,
    }))
    // console.log('✅ Reconstructed file metadata:', files)
    return {
      mode: 'multipart',
      retbody,
      files,
      filePartsRaw, // ✅ internal server use only
    }
  }

  // 🔁 NON-MULTIPART (fallback)
  const body = await readBody(event)
  return {
    mode: 'json',
    retbody: body,
  }
}


export default defineEventHandler(async (event) => {
  // console.log('testing body before');
  const { mode, retbody, filePartsRaw } = await getDataFromEvent(event);
  const body = mode == 'json' ? retbody : retbody;

  // console.log('testing body9087', filePartsRaw);
  // console.log('testing body9087333', retbody);
  cn = await connectDB();
  // console.log('within909');

  if (body.master !== 'ScreenConfigure') {
    // // console.log(.log('within9091')
    const ldtReturn = await populateDesignTimeData(body);
  }
  let collection = cn.collection;
  //if failed then raise an error
  // // console.log(.log('within9092')
  if (body.action.toUpperCase() !== 'REFDATA') {
    // // console.log(.log('within9093')
    collection = cn.collection(
      body.master === 'ScreenConfigure'
        ? 'emcFormDesign'
        : getProperty('Table Name')
    );
  }

  // console.log('within1', body.action.toUpperCase());
  switch (body.action.toUpperCase()) {
    case 'INSERT':
      let resw = {};
      if (body.data._id) {
        console.log('within insert1');

        if (filePartsRaw?.length > 0) {
          // console.log("✅ Binary upload detected. Processing...");
          // ✅ This function saves files + updates body.data at datapath
          const updated = processBinaryDataAccurate(body, filePartsRaw);
          // ✅ Replace body.data with updated version
          body.data = updated.data;
          // console.log("✅ Updated body.data after binary processing:", body.data);
        }

        const lRValue = await updatetData(collection, body, resw);
        console.log('within insert24444', lRValue);
        return lRValue;
        break;
      } else {
        if (body.master === 'ScreenConfigure') {
          insertIntoFormDesign(collection, body, resw);
          // console.log(.log('within insert90909')
          return resw;
          break;
        } else {

          if (filePartsRaw?.length > 0) {
            // console.log("✅ Binary upload detected. Processing...");
            // ✅ This function saves files + updates body.data at datapath
            const updated = processBinaryDataAccurate(body, filePartsRaw);
            // ✅ Replace body.data with updated version
            body.data = updated.data;
            // console.log("✅ Updated body.data after binary processing:", body.data);
          }

          const lRValue = await insertData(collection, body, resw);
          return lRValue;
          break;
        }
      }

    case 'LIST':
      return await GetListData(collection, cn, body);
      break;
    case 'GETCONTROLSWITHINCOMPONENT': //GetControlsWithinComponent
      return await GetControlsWithinComponent(cn, body);
    case 'GETCONTROLSDATA':
      //// // // console.log(.log('Get controls data')
      return await GetControlsData(collection, cn, body);
      break;
    case 'DELETE':
      //// // // console.log(.log('delete')
      return await deleteData(collection, body);
      break;
    case 'GETDETAIL':
      return await getDetail(collection, cn, body);
      break;
    case 'REFDATA':
      // console.log('refdata body.data.id', body.data.id);
      return await getDataForControl(cn, body);
      break;
    case 'REFLOCATIONDATA':
      // console.log('body.data.id REFLOCATIONDATA', body.data.id);
      return await getLocationData(cn, body);
      break;
    case 'REFGROUPDATA':
      // console.log('body.data.id REFLOCATIONDATA', body.data.id);
      return await getGroupData(cn, body);
      break;
  }
});


async function populateData(vid = '', vLookFor = '') {
  // // console.log(.log('insidepopulatedata', vid, vLookFor)
  mCurrentemcFormDesignobject = await cn
    .collection('emcFormDesign')
    .find({
      [vLookFor]: vid,
    })
    .toArray();
}



function parseWhere(whereStr) {
  // Operator mappings
  const ops = {
    '=': '$eq',
    '>': '$gt',
    '<': '$lt',
    '>=': '$gte',
    '<=': '$lte',
    CONTAINS: '$regex',
  };
  console.log('parseWhere', whereStr);
  // Split by OR first
  const orParts = whereStr.split(/\s+OR\s+/i).map((part) => part.trim());
  console.log('OR parts:', orParts);
  const orConditions = orParts.map((part) => {
    // Split by AND inside each OR block
    const andParts = part.split(/\s+AND\s+/i).map((cond) => cond.trim());

    const andConditions = andParts.map((cond) => {
      // Allow nested fields with dots in them
      const match = cond.match(
        /([\w.]+)\s*(=|>|<|>=|<=|CONTAINS)\s*['"]?([^'"]+)['"]?/i
      );
      if (!match) return {};

      let [, field, op, valueRaw] = match;
      op = op.toUpperCase();
      const value = isNaN(valueRaw) ? valueRaw : Number(valueRaw);

      if (op === 'CONTAINS') {
        return { [field]: { [ops[op]]: new RegExp(value, 'i') } }; // case-insensitive search
      }

      return { [field]: { [ops[op]]: value } };
    });

    return andConditions.length > 1
      ? { $and: andConditions }
      : andConditions[0];
  });

  return orConditions.length > 1 ? { $or: orConditions } : orConditions[0];
}

function parseSort(sortStr) {
  if (!sortStr) return {};

  const sortObj = {};
  sortStr.split(',').forEach((rule) => {
    const parts = rule.trim().split(/\s+/);
    const field = parts[0];
    const dir = (parts[1] || 'asc').toLowerCase(); // default asc
    sortObj[field] = dir === 'desc' ? -1 : 1;
  });

  return sortObj;
}

async function getGroupData(cn, body) {
  console.log('inside getGroupData', body.data);
  switch (body.data.grouptype?.toUpperCase()) {
    case 'LOCATION':
      return await getLocationData(cn, body);
    default:
      const lGroupDefination = await cn
        .collection('emcGroupDefination')
        .find({ GroupCode: body.data.grouptype })
        .toArray();
      // const result = await cn.collection(lGroupDefination[0].GroupEntity).aggregate().toArray()

      if (lGroupDefination.length <= 0) return [];

      const result = await cn
        .collection(lGroupDefination[0].GroupEntity)
        .aggregate([
          {
            $project: lGroupDefination[0].ReturnObject,
          },
        ])
        .toArray();

      console.log('ResultOut992', result);
      return result;
  }
  // {
  //     "_id": "$_id",
  //     "code": "$TbSHC.TbsSHC.Code",
  //     "name": "$TbSHC.TbsSHC.Name"
  //   }
}

async function getLocationData(cn, body) {
  try {
    // // console.log(.log('length12366', body.data.path ? body.data.path.split('.').length - 1 : 1 )
    // const lControlDepth = body.data.path ? body.data.path.split('.').length - 1 : 1
    //   let ltxtControls = '.Controls'.repeat(lControlDepth)
    //   ltxtControls = `FormDTObjects.board${ltxtControls}.id`
    //   // // // console.log(.log('ltxtControls', await retreiveDTData(body.data.id, ltxtControls, 'SearchTableName', lControlDepth))

    // const lSource = await retreiveDTData(body.data.id, ltxtControls, 'GroupSource', lControlDepth, true)

    // const lretreiveMasterDetails = true

    // if (lSource.touppper() === 'LOCATION')
    console.log('ResultOut990', body.data);
    // const result = await cn.collection('emcGroupData').aggregate(getDynamicUnionDataForLocation(body.data.userdata)).toArray()
    const result = await cn
      .collection('emcGroupData')
      .aggregate(getDynamicUnionDataForLocation(body.data.userdata))
      .toArray();
    console.log('ResultOut991', result, body.data.userdata);

    return result;

    // const regex = new RegExp(body.data.userdata, 'i')
    // console.log('lGroupedData12399911',lSource, body.data.userdata)
    // const lGroupedData = await cn.collection('emcGroupData').find({ 'GroupCode': { $regex: regex },'GroupType': lSource}, { projection: { GroupData: 0} }).toArray()

    // console.log('lGroupedData123',lGroupedData, "Lsource", lSource)
    // if (lGroupedData.length <= 0)
    //   return ''

    // if (lretreiveMasterDetails === true)
    //     return lGroupedData

    // return ''

    // db.collection.aggregate([
    //   { $match: { ... } },
    //   { $unionWith: { coll: "anotherCollection" } }
    // ])

    const lTableName = await retreiveDTData(
      body.data.id,
      ltxtControls,
      'SearchTableName',
      lControlDepth,
      true
    );
    // console.log('BeforelWhereClause0', body.data.id);
    const lColumnNames = await retreiveDTData(
      body.data.id,
      ltxtControls,
      'SearchColumnNames',
      lControlDepth
    );
    console.log('BeforelWhereClause1', lColumnNames);
    let lWhereClause = await retreiveDTData(
      body.data.id,
      ltxtControls,
      'WhereClause',
      lControlDepth
    );
    console.log('BeforelWhereClause2', lWhereClause);
    if (lWhereClause !== undefined && lWhereClause !== '') {
      lWhereClause = parseWhere(lWhereClause);
    } else {
      lWhereClause = {};
    }
    console.log('BeforelWhereClause3');
    console.log('lWhereClause556', lWhereClause);

    let lsortClause = await retreiveDTData(
      body.data.id,
      ltxtControls,
      'SortBy',
      lControlDepth
    );
    console.log('BeforelsortClause', lsortClause);
    if (lsortClause !== undefined || lsortClause !== '') {
      lsortClause = parseSort(lsortClause);
    } else {
      lsortClause = {};
    }
    console.log('BeforelWhereClause4');
    console.log('lsortClause', lsortClause);

    // console.log(.log('lColumnNmaes',lColumnNames)

    let lOtherColumn = lColumnNames.split('.').pop();
    if (lOtherColumn === 'Code')
      lOtherColumn = lColumnNames.replace('Code', 'Name');
    else if (lOtherColumn === 'Name')
      lOtherColumn = lColumnNames.replace('Name', 'Code');
    else lOtherColumn = null;

    // console.log(.log('lOtherColumn', lOtherColumn)

    const results = await cn
      .collection(lTableName)
      .find(lWhereClause, {
        projection: { [lColumnNames]: 1, [lOtherColumn]: 1, _id: 1 },
      })
      .sort(lsortClause)
      .toArray();
    const renamedResults = results.map((doc) => ({
      _id: doc._id,
      title: getValueByPath(doc, lColumnNames) ?? null,
    }));
    // console.log(.log('ltxtControls', results)
    console.log('ltxtControls', renamedResults);
    return renamedResults;
  } catch (res) {
    // // console.log(.log("getDataForControlError",res)
    console.log('ErrorInGetLocationData', res);
    return { error: 'Failed to fetch data' };
  }
}

function getDynamicUnionDataForLocation(lSource) {
  console.log('getDynamicUnionDataForLocation990', lSource);
  // const regex = new RegExp(lSource === '' || lSource === null ? '/.*/' : lSource, 'i')
  const regex = new RegExp('.*', 'i');

  const pipeline = [
    // Base collection (emcGroupData)
    {
      $match: { GroupCode: { $regex: regex } },
    },
    {
      $project: {
        _id: 0,
        id: '$_id',
        code: '$GroupCode',
        name: 'TEMP',
        Type: 'Group',
      },
    },

    // Union with Airport Master
    {
      $unionWith: {
        coll: 'emcAirportMaster',
        pipeline: [
          {
            $match: { 'TbAirportMaster.TbBasicDtls.Name': { $regex: regex } },
          },
          {
            $project: {
              _id: 0,
              id: '$_id',
              code: '$TbAirportMaster.TbBasicDtls.Code',
              name: '$TbAirportMaster.TbBasicDtls.Name',
              Type: 'Airport',
            },
          },
        ],
      },
    },
    {
      $unionWith: {
        coll: 'emcCityMaster',
        pipeline: [
          {
            $match: {
              'TabBasicDetails.TbBasicDetails.Name': { $regex: regex },
            },
          },
          {
            $project: {
              _id: 0,
              id: '$_id',
              code: '$TabBasicDetails.TbBasicDetails.Code',
              name: '$TabBasicDetails.TbBasicDetails.Name',
              Type: 'City',
            },
          },
        ],
      },
    },

    {
      $unionWith: {
        coll: 'emcCountryMaster',
        pipeline: [
          {
            $match: { 'TabCountryDtls.TbBasicDtls.Name': { $regex: regex } },
          },
          {
            $project: {
              _id: 0,
              id: '$_id',
              code: '$TabCountryDtls.TbBasicDtls.Code',
              name: '$TabCountryDtls.TbBasicDtls.Name',
              Type: 'Country',
            },
          },
        ],
      },
    },
  ];

  console.log('DynamicPipeline', JSON.stringify(pipeline, null, 2));
  return pipeline;
}

let mCurrentemcFormDesignobject: any

async function retreiveDTData(vId = '', vSearchWhat = '', vPropertyToLookFor = '', vControlDepth = 1, vretreiveData = false) {
  // console.log('insideretreiveDTData', vId, vSearchWhat, vPropertyToLookFor)
  // // // console.log(.log('typeof', typeof (mCurrentemcFormDesignobject))
  // if (vretreiveData === true){
  //   console.log('populateData called')
  //   await populateData(vId, vSearchWhat)
  //   console.log('populateData called after')
  // }

  await populateData(vId, vSearchWhat)
  // console.log('', mCurrentemcFormDesignobject)
  // // // console.log(.log('mCurrentemcFormDesignobject', mCurrentemcFormDesignobject)
  let lObj = findControlById(mCurrentemcFormDesignobject[0].FormDTObjects.board[0], vId)

  console.log('mCurrentemcFormDesignobject990', lObj.controlProperties.filter((e) => e.propertyTitle === vPropertyToLookFor)[0]?.data)

  // for (let i = 0; i < vControlDepth - 1; i++){
  //   // // console.log(.log('count of i', i)
  //   lObj = lObj.Controls[0]
  // }
  // // console.log(.log("retreiveDTData444 findControlById", lObj)
  // lObj = lObj.Controls.filter((e) => e.id === vId)[0]
  // // console.log(.log("retreiveDTData123", lObj.controlProperties.filter((e) => e.propertyTitle === vPropertyToLookFor)[0].data);
  return lObj.controlProperties.filter((e) => e.propertyTitle === vPropertyToLookFor)[0]?.data;
}
async function getDataForControl(cn, body) {
  try {
    // console.log('length12366', body.data);
    // // console.log(.log('length12366', body.data.path ? body.data.path.split('.').length - 1 : 1 )
    const lControlDepth = body.data.path
      ? body.data.path.split('.').length - 1
      : 1;
    let ltxtControls = '.Controls'.repeat(lControlDepth);
    ltxtControls = `FormDTObjects.board${ltxtControls}.id`;
    // // // console.log(.log('ltxtControls', await retreiveDTData(body.data.id, ltxtControls, 'SearchTableName', lControlDepth))

    let lTableName = await retreiveDTData(
      body.data.id,
      ltxtControls,
      'SearchTableName',
      lControlDepth,
      true
    );
    // console.log('lTableName33', lTableName);

    if (!lTableName || lTableName !== '') {
      //This is to handle hardcoded values within Group Data control
      console.log(
        'lTableName333',
        lTableName.includes('{'),
        lTableName.includes('}')
      );
      if (lTableName.includes('{') && lTableName.includes('}')) {
        lTableName = lTableName.replace('{', '').replace('}', '');
        console.log('lTableName334', lTableName);
        if (lTableName.includes('[') && lTableName.includes(']')) {
          console.log('lTableName335', lTableName);
          lTableName = lTableName.replace('[', '').replace(']', '');
          console.log('lTableName336', lTableName);
          const renamedResults = lTableName.split(',').map((doc) => ({
            _id: doc,
            title: doc,
          }));
          return renamedResults;
        } else {
          return lTableName;
        }
      }
    }
    let lColumnNames = await retreiveDTData(
      body.data.id,
      ltxtControls,
      'SearchColumnNames',
      lControlDepth
    );
    console.log('BeforelWhereClause1', lColumnNames);
    let lWhereClause = await retreiveDTData(
      body.data.id,
      ltxtControls,
      'WhereClause',
      lControlDepth
    );
    console.log('BeforelWhereClause2', lWhereClause);
    if (lWhereClause !== undefined && lWhereClause !== '') {
      console.log('lWhereClause009812', lWhereClause);
      lWhereClause = resolveUserInputTokens(
        lWhereClause,
        body.data.UserInputData
      );
      console.log('lWhereClause0098', lWhereClause);
      console.log('lWhereClause009811', lWhereClause);
      lWhereClause = parseWhere(lWhereClause);
    } else {
      lWhereClause = {};
    }
    console.log('BeforelWhereClause3');
    console.log('lWhereClause556', lWhereClause);

    let lsortClause = await retreiveDTData(
      body.data.id,
      ltxtControls,
      'SortBy',
      lControlDepth
    );
    console.log('BeforelsortClause', lsortClause);
    if (lsortClause !== undefined || lsortClause !== '') {
      lsortClause = parseSort(lsortClause);
    } else {
      lsortClause = {};
    }
    console.log('BeforelWhereClause4');
    console.log('lsortClause', lsortClause);

    console.log('lColumnNmaes777', lColumnNames);

    let lOtherColumn = lColumnNames.split('.').pop();
    if (lOtherColumn === 'Code')
      lOtherColumn = lColumnNames.replace('Code', 'Name');
    else if (lOtherColumn === 'Name')
      lOtherColumn = lColumnNames.replace('Name', 'Code');
    else lOtherColumn = null;

    console.log('lOtherColumn999', lOtherColumn);

    let lRetreiveDataColumnNames = await retreiveDTData(
      body.data.id,
      ltxtControls,
      'RetreiveDataColumnNames',
      lControlDepth
    );
    console.log('lRetreiveDataColumnNames', lRetreiveDataColumnNames);

    // if (lTableName=== 'emcinvItem') {
    //   lOtherColumn='gbItem.ItemName'
    //   lColumnNames = 'gbItem.ItemName'
    //   lTableName='emcINVItem'
    // }
    // console.log(
    //   'lOtherColumn999444',
    //   lOtherColumn,
    //   'lColumnNames',
    //   lColumnNames,
    //   'lTableName',
    //   lTableName,
    //   'lWhereClause',
    //   lWhereClause
    // );
    let results = await cn
      .collection(lTableName)
      .find(lWhereClause, {
        projection: {
          [lColumnNames.replace('[', '').replace(']', '')]: 1,
          [lOtherColumn]: 1,
          _id: 1,
          [lRetreiveDataColumnNames]: 1,
        },
      })
      .sort(lsortClause)
      .toArray();
    console.log('Intermidiate Results', results);

    const renamedResults = resolvePathToIdTitle_DEBUG(results, lColumnNames);

    // const renamedResults = results.map(doc => ({
    //   _id: doc._id,
    //   title: getValueByPath(doc, lColumnNames) ?? null,
    // }))
    // console.log(.log('ltxtControls', results)
    console.log('ltxtControls', renamedResults);
    return renamedResults;
  } catch (res) {
    // // console.log(.log("getDataForControlError",res)
    return { error: 'Failed to fetch data' };
  }
}
function findControlById(node: any, searchId: string): any {
  // console.log('staerting findControlById', searchId, node);
  if (node == null) return null;

  // If this object has an "id" field, check it
  if (typeof node === 'object' && node.hasOwnProperty('id') && node.id === searchId) {
    return node;
  }

  // If node is an array, search each element
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findControlById(item, searchId);
      if (found != null) return found;
    }
  }

  // If node is an object, search its properties
  if (typeof node === 'object') {
    for (const key in node) {
      if (node.hasOwnProperty(key)) {
        const found = findControlById(node[key], searchId);
        if (found != null) return found;
      }
    }
  }
  // console.log('Control not found for id:');
  return null;
}


function resolvePathToIdTitle_DEBUG(
  data: any,
  path: string
): Array<{ _id: any; title: any }> {
  // console.log(
  //   '================ START resolvePathToIdTitle_DEBUG ================'
  // );
  // console.log('RAW DATA:', data);
  // console.log('IS ROOT ARRAY:', Array.isArray(data));
  // console.log('PATH:', path);

  if (!data || !path) {
    console.warn('❌ DATA OR PATH IS EMPTY');
    return [];
  }

  const getNestedValue = (obj: any, p: string) => {
    const result = p.split('.').reduce((acc, key) => acc?.[key], obj);
    console.log('getNestedValue →', p, '=>', result);
    return result;
  };

  const arraySyntax = path.match(/^\[(.+?)\]\.(.+)$/);
  // console.log('ARRAY SYNTAX MATCH:', arraySyntax);

  /* =====================================================
     CASE 1: Root is ARRAY and path is [array].field
     ===================================================== */
  if (Array.isArray(data) && arraySyntax) {
    console.log('➡️ CASE 1: Root ARRAY + [array].field');

    const [, arrayKey, innerPath] = arraySyntax;
    // console.log('ARRAY KEY:', arrayKey);
    // console.log('INNER PATH:', innerPath);

    const result = data.flatMap((parent, parentIndex) => {
      // console.log(`-- Parent[${parentIndex}]`, parent);

      const innerArr = parent?.[arrayKey];
      // console.log(`INNER ARRAY parent[${parentIndex}][${arrayKey}]`, innerArr);
      // console.log('IS INNER ARRAY:', Array.isArray(innerArr));

      if (!Array.isArray(innerArr)) return [];

      return innerArr
        .map((item, itemIndex) => {
          // console.log(`---- Item[${itemIndex}]`, item);

          const title = getNestedValue(item, innerPath);
          const id = item?.RowID ?? item?._id;

          // console.log('RESOLVED ID:', id);
          // console.log('RESOLVED TITLE:', title);

          if (id == null || title == null) {
            // console.warn('⚠️ SKIPPING ITEM (ID or TITLE NULL)');
            return null;
          }

          return { _id: id, title };
        })
        .filter(Boolean);
    });

    // console.log('CASE 1 RESULT:', result);
    return result;
  }

  /* =====================================================
     CASE 2: Root is OBJECT and path is [array].field
     ===================================================== */
  if (!Array.isArray(data) && arraySyntax) {
    // console.log('➡️ CASE 2: Root OBJECT + [array].field');

    const [, arrayKey, innerPath] = arraySyntax;
    const innerArr = data?.[arrayKey];

    // console.log('INNER ARRAY:', innerArr);
    // console.log('IS INNER ARRAY:', Array.isArray(innerArr));

    if (!Array.isArray(innerArr)) return [];

    const result = innerArr
      .map((item, itemIndex) => {
        // console.log(`---- Item[${itemIndex}]`, item);

        const title = getNestedValue(item, innerPath);
        const id = item?.RowID ?? item?._id;

        // console.log('RESOLVED ID:', id);
        // console.log('RESOLVED TITLE:', title);

        if (id == null || title == null) {
          // console.warn('⚠️ SKIPPING ITEM');
          return null;
        }

        return { _id: id, title };
      })
      .filter(Boolean);

    // console.log('CASE 2 RESULT:', result);
    return result;
  }

  /* =====================================================
     CASE 3: Root is ARRAY and path is normal
     ===================================================== */
  if (Array.isArray(data)) {
    // console.log('➡️ CASE 3: Root ARRAY + normal path');

    const result = data
      .map((item, index) => {
        // console.log(`-- Item[${index}]`, item);

        const title = getNestedValue(item, path);
        const id = item?._id;

        // console.log('RESOLVED ID:', id);
        // console.log('RESOLVED TITLE:', title);

        if (id == null || title == null) {
          console.warn('⚠️ SKIPPING ITEM');
          return null;
        }

        return { _id: id, title };
      })
      .filter(Boolean);

    // console.log('CASE 3 RESULT:', result);
    return result;
  }

  /* =====================================================
     CASE 4: Root OBJECT + normal path
     ===================================================== */
  // console.log('➡️ CASE 4: Root OBJECT + normal path');

  const title = getNestedValue(data, path);
  const id = data?._id;

  console.log('RESOLVED ID:', id);
  console.log('RESOLVED TITLE:', title);

  if (id != null && title != null) {
    const result = [{ _id: id, title }];
    console.log('CASE 4 RESULT:', result);
    return result;
  }

  console.warn('❌ NO CASE MATCHED OR NO VALID DATA');
  return [];
}

function resolvePathToIdTitle(
  data: any,
  path: string
): Array<{ _id: any; title: any }> {
  if (!data || !path) return [];

  const getNestedValue = (obj: any, p: string) =>
    p.split('.').reduce((acc, key) => acc?.[key], obj);

  const arraySyntax = path.match(/^\[(.+?)\]\.(.+)$/);

  /* =====================================================
     CASE 1: Root is ARRAY and path is [array].field
     ===================================================== */
  if (Array.isArray(data) && arraySyntax) {
    const [, arrayKey, innerPath] = arraySyntax;

    return data.flatMap((parent) => {
      const innerArr = parent?.[arrayKey];
      if (!Array.isArray(innerArr)) return [];

      return innerArr
        .map((item) => {
          const title = getNestedValue(item, innerPath);
          const id = item?.RowID ?? item?._id;
          if (id == null || title == null) return null;
          return { _id: id, title };
        })
        .filter(Boolean);
    });
  }

  /* =====================================================
     CASE 2: Root is OBJECT and path is [array].field
     ===================================================== */
  if (!Array.isArray(data) && arraySyntax) {
    const [, arrayKey, innerPath] = arraySyntax;
    const innerArr = data?.[arrayKey];

    if (!Array.isArray(innerArr)) return [];

    return innerArr
      .map((item) => {
        const title = getNestedValue(item, innerPath);
        const id = item?.RowID ?? item?._id;
        if (id == null || title == null) return null;
        return { _id: id, title };
      })
      .filter(Boolean);
  }

  /* =====================================================
     CASE 3: Root is ARRAY and path is normal dot path
     ===================================================== */
  if (Array.isArray(data)) {
    return data
      .map((item) => {
        const title = getNestedValue(item, path);
        const id = item?._id;
        if (id == null || title == null) return null;
        return { _id: id, title };
      })
      .filter(Boolean);
  }

  /* =====================================================
     CASE 4: Root is OBJECT and path is normal dot path
     ===================================================== */
  const singleTitle = getNestedValue(data, path);
  if (singleTitle != null && data?._id != null) {
    return [{ _id: data._id, title: singleTitle }];
  }

  return [];
}

function resolveUserInputTokens(
  template: string,
  userInputs: Array<Record<string, any>>
): string {
  console.log('resolveUserInputTokens1', template, userInputs);
  if (typeof template !== 'string') return template;
  console.log('resolveUserInputTokens2777', template, userInputs);
  // Merge array into a single lookup object
  if (userInputs === undefined || userInputs === null) userInputs = [];
  const lookup = Object.assign({}, ...userInputs);
  console.log('Lookup data', lookup);
  return template.replace(/\{\$USERINPUT\|([^}]+)\}/g, (fullMatch, key) => {
    // If value exists, replace; otherwise keep original token
    return key in lookup ? String(lookup[key]) : fullMatch;
  });
}

async function getDetail(collection, cn, body) {
  //// // // console.log(.log('getDetail data 1')

  // const res = Object
  let res = Object();
  try {
    //// // // console.log(.log('getDetail', body.data, 'getDetailCollection', collection)

    const objectIds = body.data.map(
      (item) => new mongoose.Types.ObjectId(item._id)
    );
    console.log('getDetail data 22', objectIds);
    const lretObj = { _id: { $in: objectIds } };
    const result = await collection.findOne(lretObj);

    // result = await result.toArray()
    console.log('getDetail data 2', result);

    //// // // console.log(.log(result)
    if (result) {
      //// // // console.log(.log('getDetail data 3')

      res = {
        status: 201,
        success: true,
        message: 'detail retreived successfully inserte',
        detail: result,
      };
    } else {
      //// // // console.log(.log('insert data 4')

      res = {
        status: 500,
        success: false,
        message: 'Failed to insert item',
      };
    }

    return res;
  } catch (error) {
    //// // // console.log(.log(error)
    res = {
      status: 500,
      success: false,
      message: 'getDetail to get item',
      error: error.message,
    };
  }

  return res;
}

async function deleteData(collection, body) {
  //// // // console.log(.log('inside DeleteData ')

  //// // // console.log(.log('before DeleteData 2')

  const objectIds = body.data.map(
    (item) => new mongoose.Types.ObjectId(item._id)
  );

  const lretObj = { _id: { $in: objectIds } };

  //// // // console.log(.log(lretObj)

  const result = await collection.deleteMany(lretObj);

  //// // // console.log(.log('posst deleteOne')
  //// // // console.log(.log(result)
  // if (result.deletedCount === 1)
  //   //// // // console.log(.log('Successfully deleted one document.')
  // else
  //   //// // // console.log(.log('No documents matched the query.')

  return lretObj;
}

async function insertIntoFormDesign(collection, body, res) {
  //// // // console.log(.log('insert data 9.1')

  // const res = Object
  try {
    //// // // console.log(.log('insert data 9.2')
    //// // // console.log(.log(body)
    // console.log(.log('insert data screenConfigure1')
    const lemcFormDesign = await addemcFormDesign(body.data);
    // console.log(.log('insert data screenConfigure2')
    //// // // console.log(.log(lemcFormDesign)

    const result = await collection.insertOne(lemcFormDesign);

    // console.log(.log('insert data 9.3')

    // //// // // console.log(.log(result)
    if (result.acknowledged) {
      // console.log(.log('insert data 9.4')

      res.data = {
        status: 201,
        success: true,
        message: 'Item successfully inserted',
      };
      // console.log(.log('insert data 9.4', res.data)
    } else {
      //// // // console.log(.log('insert data 4')

      res.data = {
        status: 500,
        success: false,
        message: 'Failed to insert item',
      };
    }
    return res;
  } catch (error) {
    // console.log(.log(error)
    res.data = {
      status: 500,
      success: false,
      message: 'Failed to insert item',
      error: error.message,
    };
  }
}

async function updatetData(collection, body, res) {
  //// // // console.log(.log('update data 1')

  // const res = Object
  try {
    // console.log(.log('update data 1.1 this is a change')
    //// // // console.log(.log('update data body',body)

    const objectIds = new mongoose.Types.ObjectId(body.data._id);
    //// // // console.log(.log('update data 9.0')
    const lretObj = { _id: objectIds };
    // // console.log(.log('update data 9.1')
    //// // // console.log(.log('filtter object',lretObj)
    let result;
    let dataToUpdate;
    if (body.master === 'ScreenConfigure') {
      // console.log(.log('Finally screen configure updated0')
      const lemcFormDesign = await addemcFormDesign(body.data);
      // console.log(.log('Finally screen configure updated1')
      delete lemcFormDesign._id;
      // console.log(.log('Finally screen configure updated2')
      lemcFormDesign.FormDTObjects.validationSchema =
        extractZodJsonFromDTObjects(
          lemcFormDesign.FormDTObjects.board[0].Controls
        );
      // // console.log(.log("Finalschema",lemcFormDesign.FormDTObjects.validationSchema);
      // console.log(.log('Finally screen configure update3')
      lemcFormDesign.FormRTObjects.validationSchema =
        lemcFormDesign.FormDTObjects.validationSchema;
      // console.log(.log('Finally screen configure updated4')
      result = await collection.replaceOne(lretObj, lemcFormDesign);
      // console.log(.log('Finally screen configure updated10')
    } else {
      const lretObj1 = await checkUniqueattributes(body);
      // // console.log(.log('checkUniqueattributes123456', lretObj1)
      if (lretObj1.status === false) {
        res = {
          status: 500,
          success: false,
          message: lretObj1.description,
          error: 'Duplicate',
        };
        // // console.log(.log('inside check true', res)
        return res;
      }
      if (!body.data._isThisForValidate) {
        dataToUpdate = await UpdateSystemFields(body.data);
        delete dataToUpdate._id;
        result = await collection.replaceOne(lretObj, dataToUpdate);
        console.log('update data 9.2', result);
      } else {
        console.log('update data 9.2 666', result);
        result = { acknowledged: true, modifiedCount: 1 };
      }
    }
    // dataToUpdate = body.data
    //// // // console.log(.log('deletion dataToUpdate123',dataToUpdate)

    //// // // console.log(.log('update data 2')

    // //// // // console.log(.log(result)
    if (result.modifiedCount > 0) {
      // console.log(.log('Screen control updated')

      res = {
        status: 201,
        success: true,
        message: 'Action successfull',
        error: 'successfull',
      };
    } else {
      //// // // console.log(.log('insert data 4')

      res = {
        status: 500,
        success: false,
        message: 'Failed to insert item',
      };
    }
    return res;
  } catch (error) {
    //// // // console.log(.log(error)
    res = {
      status: 500,
      success: false,
      message: 'Failed to insert item',
      error: error.message,
    };
  }
}

async function insertData(collection, body, res) {
  // // // console.log(.log('insert data 1',body.data)

  // const res = Object
  try {
    const lretObj1 = await checkUniqueattributes(body);
    // // console.log(.log('insertData123456', lretObj1)
    if (lretObj1.status === false) {
      res = {
        status: 500,
        success: false,
        message: lretObj1.description,
        error: 'Duplicate',
      };
      // console.log(.log('inside check true', res)
      return res;
    }
    let result;
    if (!body.data._isThisForValidate) {
      console.log('insert data _isThisForValidate')
      const dataToInsert = await UpdateSystemFields(body.data);
      result = await collection.insertOne(dataToInsert);
    } else {
      console.log('insert data _isThisForValidate232423')
      result = { acknowledged: true, insertedId: null };
    }
    // // console.log(.log('inserted data',result)
    if (result.acknowledged) {
      res = {
        status: 201,
        success: true,
        insertedID: result.insertedId,
        message: 'Item successfully inserted',
      };
    } else {
      //// // // console.log(.log('insert data 4')

      res = {
        status: 500,
        success: false,
        message: 'Failed to insert item',
      };
    }
    return res;
  } catch (error) {
    //// // // console.log(.log(error)
    res = {
      status: 500,
      success: false,
      message: 'Failed to insert item',
      error: error.message,
    };
  }
}


async function UpdateSystemFields(data) {
  const updatedData = { ...data };
  const currentDate = new Date();

  if (!updatedData._Credentials) {
    const _Credentials = {
      IDX: (await generateId(currentUser.organizationCode, await getProperty('Table Name'))).id,
      parentIDX: null,
      parentType: null,
      organizationId: currentUser.organizationId,
      organizationCode: currentUser.organizationCode,
    };

    updatedData._Credentials = _Credentials;

  }

  if (!updatedData._Credentials.createdAt) {
    updatedData._Credentials.createdAt = currentDate;
  }
  updatedData._Credentials.updatedAt = currentDate;
  console.log('Updated system fields', updatedData);
  return updatedData;
}

async function GetControlsData(collection, cn, body) {
  console.log('inside GetControlsData ');

  let cursor;

  //// // // console.log(.log('before connection 2')

  const collectionMaster = cn.collection('emcFormDesign');

  //// // // console.log(.log('inside GetControlsData 22')

  // const lretObj = { FormData: { Controls: null, DataObject: null, RTFormObjectForUserEntry: {} } }
  let lretObj = {};

  console.log('iuoiu', body.master);
  // cursor = collectionMaster.find().filter({ 'FormParameters.Name': body.master.value })
  cursor = collectionMaster
    .find()
    .filter({
      $or: [
        { 'FormParameters.master': body.master },
        { 'FormParameters.Name': body.master },
      ],
    });
  //// // // console.log(.log('control data')
  //// // // console.log(.log(cursor)
  // const lLifeCycle = GetLifeCycleForMaster(body.master)

  lretObj = await cursor.toArray();

  // //// // // console.log(.log(temp[0].Controls)
  // lretObj.FormData.Controls = temp[0].Controls
  // lretObj.FormData.FormDTControls = temp[0].FormDTControls
  // lretObj.FormData.RTFormObjectForUserEntry = temp[0].RTFormObjectForUserEntry

  console.log(lretObj);

  return lretObj;
}

async function GetLifeCycleForMaster(vmaster) {
  const collectionMaster = cn.collection('emcLifeCycleMgmt');
  let cursor;
  cursor = collectionMaster
    .find()
    .filter({ $or: [{ master: vmaster }, { Name: vmaster }] });
  return await cursor.toArray();
}

// async function checkUniqueattributes(vbody) {
//   const body = structuredClone(vbody)
//   // // console.log(.log('checkUniqueattributes', body.data)
//   // retreiveDTData(body.master,"FormParameters.Name")
//   const collectionMaster = cn.collection('FormRateType')
//   const result = await cn
//   .collection('emcFormDesign')
//   .find(
//     {
//       'FormDTObjects.board': {
//         $elemMatch: {
//           'ControlName': 'FormContractType',
//           'Controls.controlProperties.propertyTitle': {
//                     $in: ["UniqueKey", "ColumnName"]
//                   }
//         }
//       }
//     }
//   ).toArray()

//   // // console.log(.log('10.1', body.data)
//   let lUniqueStr = ''
//   for (const obj of result[0].FormDTObjects.board[0].Controls) {
//     // // // console.log(.log('object', obj)
//     lUniqueStr = lUniqueStr + (lUniqueStr !== '' ? ',' : '' ) + obj.controlProperties.find(e=>e.propertyTitle === 'UniqueKey').data
//   }
//   const arr = lUniqueStr.split(",").filter(val => val.trim() !== "");
//   const uniqueArr = [...new Set(arr)];

//   // // console.log(.log('10.2', body.data._id)
//   uniqueArr.filter(uniqueItem => {
//     let lObjToValidate = Object
//     result[0].FormDTObjects.board[0].Controls.filter(item => {
//       const values = item.controlProperties.find(e=>e.propertyTitle === 'UniqueKey').data.split(',').map(v => v.trim())
//       if(values.includes(uniqueItem)){
//         let lobj =  {};
//         lobj[item.controlProperties.find(e=>e.propertyTitle === 'ColumnName').data] = body.data[item.controlProperties.find(e=>e.propertyTitle === 'ColumnName').data]
//         lObjToValidate = lobj
//       }
//     })
//     // // console.log(.log('10.3', body.data._id)

//     if (body.data._id) {
//       const objectIds = new mongoose.Types.ObjectId(body.data._id)
//       lObjToValidate['_id'] = { $ne: objectIds }
//       // // console.log(.log('10.5',lObjToValidate)
//     }
//     // // console.log(.log('11',lObjToValidate)

//         const cursor = cn.collection('FormRateType').find(lObjToValidate)

//     const res = cursor.toArray().then(value => {
//       // // console.log(.log('11.1', value)
//     });
//     // // console.log(.log('12', res)

//     // // console.log(.log('12.1', res.length)
//     if (res.length > 0) {
//       // // console.log(.log('12.2')

//       return false
//     }
//   })
//   // // console.log(.log('12.3')
//   return true
// // // // console.log(.log('testing unique', uniqueArr)
// }
async function populateDesignTimeData(vbody) {
  try {
    // Code
    // // console.log(.log('populateDesignTimeData55')
    // that might throw an error
    const lMaster = isRef(vbody.master) ? vbody.master.value : vbody.master;
    // // // console.log(.log('populateDesignTimeData111', vbody)
    mDTObject = await cn
      .collection('emcFormDesign')
      .find({
        'FormDTObjects.board': {
          $elemMatch: {
            ControlName: lMaster,
          },
        },
      })
      .toArray();
    // // console.log(.log('populateDesignTimeData2',mDTObject)

    return true;
  } catch (error) {
    // Code that runs if an error is thrown in try block
    // console.log(.error('An error occurred:', error)
  }
}

function getProperty(vProperty) {
  try {
    // // // console.log(.log('testing here90922')
    // // // console.log(.log('testing here909',mDTObject)
    const lDTObject = mDTObject[0].FormDTObjects.board[0];
    // // console.log(.log('testing here1', lDTObject)
    const property = lDTObject.controlProperties.find(
      (prop) => prop.propertyTitle === vProperty
    );
    // // // console.log(.log('testing here2', property)
    if (property) {
      return property?.data;
    }
    return null;
  } catch (err) {
    // console.log(.error('Something went wrong in get property:', err);
  }
}

function findControlsWithUniqueKey(controls: any[]): any[] {
  let result: any[] = [];

  for (const control of controls) {
    if (control.controlProperties) {
      const hasUniqueKey = control.controlProperties.some(
        (prop: any) => prop.propertyTitle === 'UniqueKey'
      );

      if (hasUniqueKey) {
        result.push({
          ControlName: control.ControlName,
          controlType: control.controlType,
          dataPath: control.dataPath,
          controlProperties: control.controlProperties.filter(
            (prop: any) =>
              prop.propertyTitle === 'UniqueKey' ||
              prop.propertyTitle === 'ColumnName'
          ),
          data: control.controlProperties.filter(
            (prop: any) => prop.propertyTitle === 'UniqueKey'
          )[0].data,
        });
      }
    }

    // if nested Controls exist, search recursively
    if (control.Controls && control.Controls.length > 0) {
      result = result.concat(findControlsWithUniqueKey(control.Controls));
    }
  }

  return result;
}

async function checkUniqueattributes(vbody) {
  try {
    const body = structuredClone(vbody);

    // console.log(.log('Starting checkUniqueattributes', body)

    // const collectionMaster = cn.collection(getProperty('Table Name'))
    const collectionMaster = cn.collection(
      body.master === 'ScreenConfigure'
        ? 'emcFormDesign'
        : await getProperty('Table Name')
    );

    // console.log(.log("UniqueKeys",findControlsWithUniqueKey(mDTObject[0].FormDTObjects.board[0].Controls))

    // console.log(.log('Starting checkUniqueattributes2', collectionMaster)
    const controls = findControlsWithUniqueKey(
      mDTObject[0].FormDTObjects.board[0].Controls
    ); //mDTObject[0].FormDTObjects.board[0].Controls
    // console.log(.log('Starting checkUniqueattributes3', controls)
    // Collect UniqueKey values
    const lUniqueStr = controls
      .map(
        (obj) =>
          obj.controlProperties.find((e) => e.propertyTitle === 'UniqueKey')
            ?.data
      )
      .filter(Boolean)
      .join(',');

    const uniqueArr = [
      ...new Set(
        lUniqueStr
          .split(',')
          .map((val) => val.trim())
          .filter(Boolean)
      ),
    ];
    // console.log(.log('Starting checkUniqueattributes4', uniqueArr)
    for (const uniqueItem of uniqueArr) {
      // console.log(.log('Starting checkUniqueattributes5', uniqueItem)
      let lObjToValidate = {};
      let lStrForError = 'Duplicate data exists for :';
      for (const item of controls) {
        const controlProps = item.controlProperties;
        const uniqueKeys = controlProps
          .find((e) => e.propertyTitle === 'UniqueKey')
          ?.data?.split(',')
          .map((s) => s.trim());
        // console.log(.log('Starting checkUniqueattributes6', uniqueKeys)
        if (uniqueKeys?.includes(uniqueItem)) {
          const columnName = controlProps.find(
            (e) => e.propertyTitle === 'ColumnName'
          )?.data;
          // console.log(.log('Starting checkUniqueattributes7', columnName)
          if (columnName) {
            const ldata = item.dataPath
              .replace('FormName.', '')
              .split('.')
              .reduce((acc, key) => acc?.[key], body.data);
            // // console.log(.log('Starting checkUniqueattributes7.5', 'TabRateManagent.TbRateMgmt.Reference'.split('.').reduce((acc, key) => acc?.[key], body.data))
            // // console.log(.log('Starting checkUniqueattributes8', item.dataPath)
            lObjToValidate[item.dataPath.replace('FormName.', '')] = ldata;

            lStrForError = `${lStrForError === 'Duplicate data exists for :' ? '' : lStrForError + ','}\n ${columnName} = ${ldata?.title ? ldata.title : ldata}`;

            // lStrForError = body.data[item.dataPath.replace('FormName.', '')]

            // console.log(.log('Starting checkUniqueattributes9', lStrForError)
          }
        }
      }

      if (body.data._id) {
        lObjToValidate['_id'] = {
          $ne: new mongoose.Types.ObjectId(body.data._id),
        };
      }

      // console.log(.log('Validating for uniqueness with query:', lObjToValidate)

      const existing = await collectionMaster.findOne(lObjToValidate);
      // console.log(.log('Duplicate found for909:', existing)
      if (existing) {
        // console.log(.log('Duplicate found for:', lStrForError)
        return { status: false, description: lStrForError };
      }
    }
    return { status: true, description: '' };
    // return true
  } catch (error) {
    // console.log(.log('Error in checkUniqueattributes:', error)
  }
}

async function GetListData(collection, cn, body) {
  let cursor;

  //// // // console.log(.log('before connection 1')

  const collectionMaster = cn.collection('emcFormDesign');
  const lretObj = {
    FormData: {
      validationSchema: null,
      FormParameters: null,
      UserEntryObjects: null,
      ListHeaders: null,
      FormRTSearchObjects: null,
      GridData: null,
      SearchCriteriaAttributesData: null,
      PaginationOutPutData: null,
      error: { errorCode: '', errorDesc: '' },
    },
  };
  let lFormParameters: any;
  lFormParameters = { ListHeaders: { headers: null } };
  //// // // console.log(.log('testing 0 ')
  if (body.retreiveConfData === true) {
    //// // // console.log(.log('inside body.retreiveConfData 1 ')
    lFormParameters = collectionMaster.find({
      $or: [
        { 'FormParameters.master': body.master },
        { 'FormParameters.Name': body.master },
      ],
    });
    //// // // console.log(.log('inside body.retreiveConfData 1.1 ')

    lFormParameters = (await lFormParameters.toArray())[0];
    if (lFormParameters === undefined) {
      lretObj.FormData.error.errorCode = '01';
      lretObj.FormData.error.errorDesc = 'No Header Defined';
      //// // // console.log(.log('error in header')

      return lretObj;
    }
    //// // // console.log(.log('inside body.retreiveConfData 1.2 ')
    // // // console.log(.log('LISTDATA', lFormParameters.FormParameters.Title)

    lretObj.FormData.FormParameters = {
      Title: lFormParameters.FormParameters.Title,
      Description: lFormParameters.FormParameters.Description,
    };

    lretObj.FormData.ListHeaders = lFormParameters['ListHeaders'];

    lretObj.FormData.FormRTSearchObjects =
      lFormParameters['FormRTSearchObjects'];

    lretObj.FormData.validationSchema =
      lFormParameters.FormRTObjects?.validationSchema;
    lretObj.FormData.UserEntryObjects = lFormParameters.UserEntryObjects;

    // // console.log(.log('LISTDATA23999', lretObj.FormData?.UserEntryObjects)
    //// // // console.log(.log('headersyy', lFormParameters['ListHeaders'])
    //// // // console.log(.log('inside body.retreiveConfData 2 ',lretObj.FormData)
    //// // // console.log(.log('inside griddataonly')
    //// // // console.log(.log(lFormParameters)
  }
  //// // // console.log(.log('just before')
  console.log('pbody.PageParameters)', body.PageParameters?.Limit);

  const lPage = Number.parseInt(body.PageParameters?.CurrentPage) || 1;
  const lLimit = Number.parseInt(body.PageParameters?.Limit) || 10;
  const lstartIndex = (lPage - 1 <= 0 ? 0 : lPage - 1) * lLimit;

  // let lobj1 = collectionMaster.find().filter({ 'FormParameters.master': body.master })
  // //// // // console.log(.log(await lobj1.toArray())
  //// // // console.log(.log('testing 4 ')

  const lGridDataWhereClause = constructWhereClause(body.data);

  // console.log("grdwhereclause",lGridDataWhereClause)
  cursor = collection
    .find(lGridDataWhereClause)
    .limit(lLimit)
    .skip(lstartIndex);

  const lTotalRecordCount =
    await collection.countDocuments(lGridDataWhereClause);

  cursor = await cursor.toArray();
  lretObj.FormData.GridData = cursor;

  console.log('grdwhereclause111', lTotalRecordCount);

  const lPaginationObj = {};

  lPaginationObj.TotalPages = Math.ceil(lTotalRecordCount / lLimit);
  lPaginationObj.TotalRecordCount = lTotalRecordCount;
  lPaginationObj.CurrentPage = lPage;
  lPaginationObj.Limit = lLimit;
  lretObj.FormData.PaginationOutPutData = lPaginationObj;

  //// // // console.log(.log(lretObj.FormData.PaginationOutPutData)
  //// // // console.log(.log('just before return')
  //// // // console.log(.log(lretObj)

  return lretObj;
}

function constructWhereClause(vWhereObj) {
  const query = {};

  //// // // console.log(.log('where clause construct started')
  //// // // console.log(.log(vWhereObj)

  if (Array.isArray(vWhereObj) === false) {
    console.log('not an array');
    return {};
  }
  // // console.log(.log('where clause construct', vWhereObj)
  vWhereObj.forEach((cond) => {
    //// // // console.log(.log('inside where obj')
    //// // // console.log(.log('inside where obj 777')
    //// // // console.log(.log(cond.Attribute.DBName)
    query[cond.Attribute.DBName] = returnConditionWithObject(cond);

    console.log('constructWhereClause12', query[cond.Attribute.DBName]);
  });

  // query = { COUNTER: { $eq: 2 } }
  // // // console.log(.log(query)

  return query;
}

function returnConditionWithObject(vCond: any) {
  //// // // console.log(.log('This is testing return condition')
  //// // // console.log(.log(vCond)
  //// // // console.log(.log(vCond.Condition)
  //// // // console.log(.log('Thisis postcond sdf1123')
  //// // // console.log(.log(returnSymbol(vCond.Condition))

  const lObj = {};
  const lSymbolToUse = returnSymbol(vCond.Condition);
  const lReturnCondition = {};
  const lInput =
    vCond.Attribute.datatype === 'number' ? Number(vCond.Input) : vCond.Input;

  lObj[lSymbolToUse] = lInput;
  switch (vCond.Condition) {
    case 'Contains':
      break;
    case 'Like':
      lObj['$options'] = 'i';
      break;
  }
  //// // // console.log(.log(lObj)

  return lObj;
}
function returnSymbol(vText) {
  switch (vText) {
    case 'Greater Than':
      return '$gt';
    case 'Greater Than Equal':
      return '$gte';
    case 'Less Than':
      return '$lt';
    case 'Less Than Equal':
      return '$lte';
    case 'Like':
      return '$regex';
    case 'Contains':
      return '$regex';
    case 'Equals':
      return '$eq';
    case 'Not Equals':
      return '$ne';
    case 'In':
      return '$in';
    case 'Not In':
      return '$nin';
    default:
      return '$eq';
  }
}

export function extractZodJsonFromDTObjects(controls: any[]): any {
  const schema: any = {};

  controls.forEach((control) => {
    let controlName = control.ControlName;
    let controlSchema: any = {};

    if (control.controlProperties) {
      control.controlProperties.forEach((prop) => {
        if (prop.propertyTitle === 'DataType') {
          controlSchema.type =
            prop.data === 'number'
              ? 'number'
              : prop.data === 'boolean'
                ? 'boolean'
                : 'string';
        }

        if (prop.propertyTitle === 'Mandatory') {
          controlSchema.required = prop.data?.value === 'true';
          // controlSchema.allowNull = !controlSchema.required
          if (
            controlSchema.required === true &&
            (controlSchema.type === 'DropDown' ||
              controlSchema.type === 'AutoComplete' ||
              controlSchema.type === 'GroupData')
          ) {
            controlSchema.message = 'Data missing';
          }
        }

        if (prop.propertyTitle === 'DBMinSize' && prop.data) {
          controlSchema.min = parseInt(prop.data);
        }

        if (prop.propertyTitle === 'DBMaxSize' && prop.data) {
          controlSchema.max = parseInt(prop.data);
        }

        if (prop.propertyTitle === 'ColumnName' && prop.data) {
          controlName = prop.data;
        }
      });
      console.log('controlType1234', control.controlType);
      if (
        control.controlType === 'RateDefinition' ||
        control.controlType === 'Image' || control.controlType === 'Pricing'
      ) {
        // console.log("RateDefinitioncontrol123999", control)
        controlSchema.type = 'object';
        controlSchema.ignore = true;
        controlSchema.required = false;
      }
      if (
        control.controlType === 'Tabs'
      ) {
        // console.log("RateDefinitioncontrol123999", control)
        controlSchema.type = 'object';
        controlSchema.required = false;
      }
      if (
        control.controlType === 'DropDown' ||
        controlSchema.type === 'AutoComplete'
      ) {
        console.log(
          'dropdown124',
          control.controlProperties.filter(
            (e) => e.propertyTitle === 'Multiselect'
          )[0]?.data
        );
        controlSchema.type =
          control.controlProperties.filter(
            (e) => e.propertyTitle === 'Multiselect'
          )[0]?.data === 'true'
            ? 'Array'
            : 'object';
        ((controlSchema._id = {
          required: false,
          type: 'string',
          min: 1,
          message: '_id is required',
        }),
          (controlSchema.title = {
            required: false,
            type: 'string',
            min: 1,
            message: 'title is required',
          }));
      }

      if (control.controlType === 'GroupData') {
        //{ "id": "68c94188a74b535a9d0de96c", "code": "BOM", "name": "BOMBAY", "Type": "Airport", "title": "BOM – BOMBAY", "group": "Airport" }
        console.log('GroupData990');
        controlSchema.Type = {
          required: true,
          type: 'string',
          min: 1,
          message: 'Type is required',
        };

        controlSchema.rows = {
          type: 'Array',
          required: true,

          rowId: {
            required: true,
            type: 'string',
            min: 1,
            message: 'rowId is required',
          },

          selectedItem: {
            required: true,

            id: {
              required: true,
              type: 'string',
              min: 1,
              message: 'id is required',
            },

            code: {
              required: true,
              type: 'string',
              min: 1,
              message: 'code is required',
            },

            name: {
              required: true,
              type: 'string',
              min: 1,
              message: 'name is required',
            },

            Type: {
              required: true,
              type: 'string',
              min: 1,
              message: 'Type is required',
            },
          },
        };
      }
    }

    if (control.Controls && control.Controls.length > 0) {
      let nested = extractZodJsonFromDTObjects(control.Controls);
      // console.log('final schema 909', control.ControlName, control.controlType, nested)
      if (control.controlType === 'GridTable') controlSchema.type = 'Array';

      Object.assign(controlSchema, nested);
      console.log('final schema1234', controlSchema);
    }

    schema[controlName] = controlSchema;
  });

  return schema;
}
