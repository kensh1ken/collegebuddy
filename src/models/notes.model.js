const mongoose = require('mongoose');
const notesSchema = new mongoose.Schema({
  title:{
    type:String,
    required:true,
  },
  description:{
    type:String,
  },
  courseId:{
    type:String,
    required:true
  },
  semester:{
    type:Number,
    required:true
  },
  resourceType:{
    type:String,
    enum:['file' , 'link']
  },
  fileUrl:{
    type:String,
    required: function() {
      return this.resourceType === 'file';
    }
  },
  externalLink:{
    type:String,
    required: function() {
      return this.resourceType === 'link';
    }
  },
  uploadedBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
  }
},
{
  timestamps:true
})

module.exports = mongoose.model('Notes' , notesSchema);