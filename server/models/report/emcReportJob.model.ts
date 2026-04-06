import mongoose from "mongoose"

const schema = new mongoose.Schema({
  reportId: String,
  params: Object,
  status: String,
  result: Object,
  createdBy: String,
  createdWhen: Date,
  startedWhen: Date,
  completedWhen: Date,
  error: String
})

export default mongoose.model("emcReportJob", schema)
