const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name:{
    type:String,
    required:true,
    trim:true
  },
  email:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true 
  },
  password:{
    type:String,
    required:true,
    minlength:8,
    select:false
  },
  course:{
    type:String,
    
  },
  branch:{
    type:String,
    
  },
  currentSem:{
    type:Number,
    
  },
  role:{
    type:String,
    enum:['student' , 'admin'],
    default:'student'
  },
  isBlocked:{
    type:Boolean,
    default:false
  },
  profileCompleted:{
    type:Boolean,
    default:false
  },
  rollNumber:{
    type:String,
    trim:true,
    unique:true,
    sparse:true
  }

},
{
  timestamps:true

});
userSchema.pre('save' , async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password , salt);
})
userSchema.statics.login = async function(email , password) {
  const user = await this.findOne({email}).select('+password');
  if (!user) return null;
  const authenticated = await bcrypt.compare(password, user.password);
  return authenticated ? user : null;
}
userSchema.set('toJSON', {
  transform: (_document, returned) => {
    delete returned.password;
    delete returned.__v;
    return returned;
  }
});
module.exports = new mongoose.model('User' , userSchema)
