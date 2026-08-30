const lostAndFound = require("../models/lostAndFound.model");
module.exports.createPost = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const {
      title,
      description,
      category,
      type,
      location,
      contactNumber,
    } = req.body;

    const normalizedCategoryMap = {
      electronics: "Electronics",
      books: "Books",
      "id card": "ID Card",
      documents: "ID Card",
      wallet: "Wallet",
      keys: "Keys",
      clothing: "Clothing",
      accessories: "Accessories",
      other: "Other",
      others: "Others",
    };

    const normalizedTypeMap = {
      lost: "Lost",
      found: "Found",
    };

    const safeCategory = normalizedCategoryMap[String(category || "").trim().toLowerCase()] || category;
    const safeType = normalizedTypeMap[String(type || "").trim().toLowerCase()] || type;

    const report = await lostAndFound.create({
      title,
      description,
      category: safeCategory,
      type: safeType,
      location,
      imageUrl: req.file ? `/uploads/lost-found/${req.file.filename}` : "",
      contactNumber,
      postedBy: req.user._id,
    });

    return res.status(201).json({
      message: "Reported Successfully!",
      report,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};
module.exports.getAllPost = async (req , res)=>{
  try {
    const reports = await lostAndFound.find()
    .populate("postedBy" , "name email")
    .sort({createdAt:-1});

    return res.status(200).json({
      message:"Fetched all reports",
      reports
    })

  } catch(err) {
    return res.status(500).json({
      message:err.message
    })
  }
}
module.exports.getSinglePost = async (req , res) =>{
  try{
    const report = await lostAndFound.findById(req.params.id)
    .populate("postedBy" , "name email")

    if(!report) {
      return res.status(404).json({
        message:"Report not found"
      })
    }

    return res.status(200).json({
      message:"Fetched post",
      report
    })
  }catch(err) {
    return res.status(500).json({
      message:err.message
    })
  }
  
}
module.exports.getMyPosts = async (req , res)=>{
  try{
    const report = await lostAndFound.find({
      postedBy:req.user._id
    }).sort({createdAt:-1})
    if(report.length === 0) {
      return res.status(404).json({
        message:"No reports by user"
      })
    }
    return res.status(200).json({
      message:"Fetched reports",
      report
    })
  } catch(err) {
    return res.status(500).json({
      message:err.message
    })
  }
}
module.exports.updatePost = async (req , res)=>{
  try {
    const report = await lostAndFound.findById(req.params.id)
    if(!report) {
      return res.status(404).json({
        message:"Report not found"
      })
    }
    if(report.postedBy.toString() !== req.user._id) {
      return res.status(403).json({
        message:"You are not allowed to update this post"
      })
    }
    report.title = req.body.title,
    report.description = req.body.description,
    report.location = req.body.location

    await report.save()

    return res.status(200).json({
    message: "Report updated successfully",
    report
});
  } catch(err) {
    return res.status(500).json({
      message:err.message
    })
  }
}
