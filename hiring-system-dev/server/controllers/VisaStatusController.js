import Document from "../models/Document.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import VisaStatus from "../models/VisaStatus.js";
import { deleteFileFn } from "./S3BucketController.js";

export const submitDocument = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const type = req.body.type;

    const employee = await Employee.findById(employeeId)
      .populate({
        path: "visaStatus",
        populate: { path: "documents" },
      })
      .lean()
      .exec();

    const deleteDoc = employee?.visaStatus?.documents.find(
      (item) => item.type === type
    );

    if (deleteDoc) {
      await deleteFileFn(deleteDoc.awsKey);
      await Document.deleteOne({ _id: deleteDoc._id });
    }

    if (!req.file) {
      return res.status(400).json({ message: "File not uploaded" });
    }
    const { originalname, location, key } = req.file;

    const newDoc = new Document({
      type,
      src: location,
      filename: originalname,
      awsKey: key,
    });

    await newDoc.save();

    const updatedStatus = await VisaStatus.findByIdAndUpdate(
      employee.visaStatus._id,
      { $push: { documents: newDoc._id } },
      { new: true }
    )
      .populate("documents")
      .lean()
      .exec();

    const nextStep = getNextStep(updatedStatus.documents);

    return res
      .status(201)
      .json({ message: "File submitted successfully!", data: nextStep });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getVisaStatusNextStep = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const employee = await User.findById(employeeId)
      .populate({
        path: "visaStatus",
        populate: { path: "documents" },
      })
      .lean()
      .exec();
    const nextStep = getNextStep(employee.visaStatus.documents);
    res.status(200).json({ data: nextStep, message: "success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllPendingStatuses = async (_req, res) => {
  try {
    const allUsers = await User.find({
      visaStatus: { $exists: true, $ne: null },
    })
      .populate({
        path: "visaStatus",
        populate: { path: "documents" },
      })
      .populate("onboardingStatus")
      .lean()
      .exec();

    const approvedUsers = allUsers.filter(
      (employee) =>
        employee.onboardingStatus &&
        employee.onboardingStatus.status === "Approved"
    );
    const pendingStatuses = approvedUsers.reduce((acc, employee) => {
      if (employee.visaStatus.documents.length > 0) {
        const nextStep = getNextStep(employee.visaStatus.documents);

        if (
          !nextStep ||
          (nextStep.type === "I-20" && nextStep.status === "approved")
        ) {
          return acc;
        }

        employee.nextStep = nextStep;
        acc.push(employee);
        return acc;
      }
      return acc;
    }, []);

    res.status(200).json({
      data: pendingStatuses,
      message: "Fetch all pending visa statuses successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllStatuses = async (_req, res) => {
  try {
    const allUsers = await User.find({
      visaStatus: { $exists: true, $ne: null },
    })
      .populate({
        path: "visaStatus",
        populate: { path: "documents" },
      })
      .populate("onboardingStatus")
      .lean()
      .exec();

    const approvedUsers = allUsers.filter(
      (employee) =>
        employee.onboardingStatus &&
        employee.onboardingStatus.status === "Approved"
    );
    const allStatuses = approvedUsers.reduce((acc, employee) => {
      if (employee.visaStatus.documents.length > 0) {
        const nextStep = getNextStep(employee.visaStatus.documents);

        employee.nextStep = nextStep;
        acc.push(employee);
        return acc;
      }
      return acc;
    }, []);

    res.status(200).json({
      data: allStatuses,
      message: "Fetch all visa statuses successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getNextStep = (documents) => {
  try {
    const sequence = ["OPT Receipt", "OPT EAD", "I-983", "I-20"];

    // Handle case when documents array is empty
    if (!documents || documents.length === 0) {
      return {
        type: sequence[0], // First step in the sequence
        status: "not-submitted",
        src: null,
        feedback: "",
      };
    }

    // Filter and sort documents based on their order in the sequence
    const sortedDocuments = documents
      .filter((doc) => sequence.includes(doc.type))
      .sort((a, b) => sequence.indexOf(a.type) - sequence.indexOf(b.type));

    if (sortedDocuments.length === 0) {
      return {
        type: sequence[0], // No relevant documents found, return the first step
        status: "not-submitted",
        src: null,
        feedback: "",
      };
    }

    // Check if all documents are approved
    const allApproved =
      sortedDocuments.length === sequence.length &&
      sortedDocuments.every((doc) => doc.status === "approved");

    if (allApproved) {
      // If all steps are approved, return the last step (I-20)
      return sortedDocuments[sortedDocuments.length - 1];
    }

    // Get the last submitted document in the sequence
    const lastDocument = sortedDocuments[sortedDocuments.length - 1];

    // If the last submitted document is not approved, return it
    if (lastDocument && lastDocument.status !== "approved") {
      return lastDocument;
    }

    // If the last document is approved, find the next step in the sequence
    const nextIndex = sequence.indexOf(lastDocument.type) + 1;
    if (nextIndex < sequence.length) {
      // Return a placeholder for the next step
      return {
        type: sequence[nextIndex],
        status: "not-submitted",
        src: null,
        feedback: "",
      };
    }

    // Default case: Return the first step if no relevant documents are submitted yet
    return {
      type: sequence[0],
      status: "not-submitted",
      src: null,
      feedback: "",
    };
  } catch (error) {
    console.error("Error in getNextStep:", error);
    return null; // Return null or an appropriate fallback if there's an error
  }
};

export const postDocumentFeedback = async (req, res) => {
  try {
    const { documentId, feedback } = req.body;

    const updatedDocument = await Document.findByIdAndUpdate(
      documentId,
      { hrFeedback: feedback },
      { new: true }
    );

    if (!updatedDocument) {
      return res.status(404).send({ error: "Document not found." });
    }

    res
      .status(200)
      .json({ data: updatedDocument, message: "Post feedback successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const changeDocumentStatus = async (req, res) => {
  try {
    const { documentId, status } = req.body;
    const updatedDocument = await Document.findByIdAndUpdate(
      documentId,
      { status },
      { new: true }
    );

    if (!updatedDocument) {
      return res.status(404).send({ error: "Document not found." });
    }
    res
      .status(200)
      .json({ data: updatedDocument, message: "Change status successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
