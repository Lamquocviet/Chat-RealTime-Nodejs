import mongoose from "mongoose";


const auditLogSchema = new mongoose.Schema(
  {

    // Ai thực hiện hành động
    actor:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"User",
      required:true
    },


    // Hành động gì
    action:{
      type:String,
      enum:[

        "CREATE_USER",

        "UPDATE_USER",

        "DELETE_USER",

        "BLOCK_USER",

        "UNBLOCK_USER",

        "CHANGE_ROLE",

        "CHANGE_PASSWORD",

        "CREATE_GROUP",

        "UPDATE_GROUP",

        "DELETE_GROUP",

        "DELETE_MESSAGE",

        "LOGIN",

        "LOGOUT",

        "FORGOT_PASSWORD_REQUEST",

        "RESET_PASSWORD"

      ],
      required:true
    },


    // Đối tượng bị tác động

    targetType:{
      type:String,

      enum:[

        "user",

        "group",

        "message",

        "system"

      ],

      required:true
    },



    // id của đối tượng

    targetId:{

      type:mongoose.Schema.Types.ObjectId

    },



    // dữ liệu thêm

    details:{

      type:Object,

      default:{}

    },



    // ip người thực hiện

    ipAddress:{

      type:String

    }


  },


  {
    timestamps:true
  }

);



// index để query nhanh

auditLogSchema.index({
  createdAt:-1
});


auditLogSchema.index({
  actor:1
});


auditLogSchema.index({
  targetType:1,
  targetId:1
});



const AuditLog =
mongoose.model(
  "AuditLog",
  auditLogSchema
);



export default AuditLog;