const { asyncHandler } = require("../utils/async");
const { listHospitals, listApprovedHospitals, createHospital, listHospitalDoctors } = require("../services/hospital.service");

const list = asyncHandler(async (req, res) => {
  const hospitals = await listHospitals();
  res.json({ success: true, data: hospitals });
});

const approved = asyncHandler(async (req, res) => {
  const hospitals = await listApprovedHospitals();
  res.json({ success: true, data: hospitals });
});

const create = asyncHandler(async (req, res) => {
  const hospital = await createHospital(req.body);
  res.status(201).json({ success: true, data: hospital });
});

const doctors = asyncHandler(async (req, res) => {
  const list = await listHospitalDoctors(req.params.id);
  res.json({ success: true, data: list });
});

module.exports = { list, approved, create, doctors };
