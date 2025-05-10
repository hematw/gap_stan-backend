import { MongoServerError } from "mongodb";

const errorHandler = (
  err,
  req,
  res,
  next
) => {
  console.log("❌❌❌", err);
  if (err.code === 11000) {
    const duplicateError = Object.entries(err.keyValue);
    const duplicateField = duplicateError[0][0];
    const duplicateValue = duplicateError[0][1];
    let customMessage = "";

    if (duplicateField === "username") {
      customMessage = `${duplicateField} ${duplicateValue} is not available!`;
    } else if (duplicateField === "email") {
      customMessage = `There is already an account with ${duplicateValue}`;
    }

    return res.status(409).json({
      message:
        customMessage || `${duplicateField} ${duplicateValue} already exists`,
      duplicateField,
    });
  }
  // else if(err instanceof )
  res.status(500).json({ err });
};

export default errorHandler;