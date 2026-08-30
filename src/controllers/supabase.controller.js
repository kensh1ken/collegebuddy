const Notes = require('../models/notes.model')
const supabase = require('../config/supabase')

module.exports.createResource = async ( req , res)=>{
  try{
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const {
      title,
      description,
      courseId,
      semester,
      resourceType,
      externalLink
    } = req.body;

    if(resourceType === 'file' ) {
      if(!req.file) {
        return res.status(400).json({
          message:"please upload a file"
        })
      }

      const fileName = `${Date.now()}-${req.file.originalname}`;

      const { error } = await supabase.storage
        .from("CBResources")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype
        });

      if(error) {
        return res.status(500).json({
          message:error.message
        })
      }

      const { data } = await supabase.storage
        .from("CBResources")
        .getPublicUrl(fileName);

      const resource = await Notes.create({
        title,
        description,
        courseId,
        semester,
        resourceType,
        fileUrl: data.publicUrl,
        uploadedBy: req.user._id
      });

      return res.status(201).json({
        message: "Resource uploaded successfully",
        resource
      });
    }

    if (resourceType === "link") {
      if (!externalLink) {
        return res.status(400).json({
          message: "Please provide a resource link"
        });
      }

      const resource = await Notes.create({
        title,
        description,
        courseId,
        semester,
        resourceType,
        externalLink,
        uploadedBy: req.user._id
      });

      return res.status(201).json({
        message: "Resource added successfully",
        resource
      });
    }

    return res.status(400).json({
      message: "Invalid resource type"
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message
    });
  }
}

module.exports.getAllResources = async (req , res)=>{
    try{
    const { search , courseId , semester , resourceType} = req.query;
    const filter = {};
    if(search) {
        filter.title = {
            $regex: search,
            $options: "i"
        }
    }
    if(semester) {
        filter.semester= semester
    }
    if(courseId) {
        filter.courseId = courseId;
    }
    if(resourceType) {
        filter.resourceType = resourceType
    }
    const resources = await Notes.find(filter)
        .populate("uploadedBy" , "name email")
        .sort({createdAt: -1})

    return res.status(200).json({
        message:"Fetched resources",
        resources
    });
}catch(err) {
    return res.status(500).json({
        message:err.message
    })
}
};
module.exports.getSingleResource = async (req, res) => {
    try {
        const resource = await Notes.findById(req.params.id)
            .populate("uploadedBy", "name email");

        if (!resource) {
            return res.status(404).json({
                message: "Resource not found"
            });
        }

        return res.status(200).json({
            message: "Fetched resource",
            resource
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};
