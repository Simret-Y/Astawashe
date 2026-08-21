const notFoundHandler = (req, res) => {
  res.status(404).json({ message: "Route not found" });
};

const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Unexpected error";
  if (process.env.NODE_ENV !== "test") {
    console.error(err);
  }
  res.status(status).json({ message });
};

module.exports = { notFoundHandler, errorHandler };
