class ServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const requirePositiveInteger = (value, label = "ID") => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new ServiceError(400, `A valid ${label} is required`);
  return id;
};

const requireValidDate = (value, label = "date") => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    throw new ServiceError(400, `A valid ${label} is required`);
  }
  return date;
};

module.exports = { ServiceError, requirePositiveInteger, requireValidDate };
